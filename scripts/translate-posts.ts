import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import process from "node:process";

import OpenAI from "openai";
import * as s from "remix/data-schema";
import { minLength } from "remix/data-schema/checks";

import { type Lang, LANGUAGE_CONFIG, SUPPORTED_LANGS } from "@/i18n/index.ts";
import {
  findPostDirectories,
  postDates,
  type PostDirectory,
  type PostFile,
  postFilePath,
  type PostFrontMatter,
  postGenerated,
  POSTS_DIRECTORY,
  postSummary,
  postTitle,
  readPostVariants,
  serializePost,
  SOURCE_LANGUAGE,
} from "@/data/post-files.ts";

const STAGING_DIRECTORY = ".tmp/translate-posts";

type TranslationResult = {
  title: string;
  content: string;
  summary: string;
};

export type ArticleAi = {
  summarize(options: {
    language: Lang;
    title: string;
    content: string;
  }): Promise<string>;
  translate(options: {
    sourceLanguage: Lang;
    targetLanguage: Lang;
    title: string;
    content: string;
  }): Promise<TranslationResult>;
};

export type ProcessingResult = {
  articles: number;
  failedArticles: number;
  generatedVariants: number;
  generatedSummaries: number;
  writtenFiles: number;
};

type ArticleFiles = {
  directory: PostDirectory;
  source: PostFile;
  variants: Map<Lang, PostFile>;
};

type PendingWrite = {
  content: string;
  filePath: string;
};

const nonEmptyString = s.string().transform((value) => value.trim()).pipe(
  minLength(1),
);

const translationOutputSchema = s.object({
  title: nonEmptyString,
  content: nonEmptyString,
  summary: nonEmptyString,
});

export function normalizeOpenAiBaseURL(
  value: string | undefined,
): string | undefined {
  if (!value) return undefined;
  const url = new URL(value);
  if (url.pathname === "/") url.pathname = "/v1";
  return url.href;
}

export async function processPosts(options: {
  ai: ArticleAi;
  postsDirectory?: string;
  stagingDirectory?: string;
}): Promise<ProcessingResult> {
  const postsDirectory = options.postsDirectory ?? POSTS_DIRECTORY;
  const stagingDirectory = options.stagingDirectory ?? STAGING_DIRECTORY;
  const articles = await loadArticleFiles(postsDirectory);
  const result: ProcessingResult = {
    articles: articles.length,
    failedArticles: 0,
    generatedVariants: 0,
    generatedSummaries: 0,
    writtenFiles: 0,
  };

  for (const article of articles) {
    try {
      const articleResult = await processArticle(
        article,
        options.ai,
        stagingDirectory,
      );
      result.generatedVariants += articleResult.generatedVariants;
      result.generatedSummaries += articleResult.generatedSummaries;
      result.writtenFiles += articleResult.writtenFiles;
      console.log(
        `[posts:translate] ${article.directory.slug}: ${articleResult.writtenFiles} file(s) updated`,
      );
    } catch (error) {
      result.failedArticles += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[posts:translate] ${article.directory.slug}: ${message}`);
    }
  }

  return result;
}

export function createOpenAiArticleAi(
  client: OpenAI,
  model: string,
): ArticleAi {
  async function summarize(options: {
    language: Lang;
    title: string;
    content: string;
  }): Promise<string> {
    const language = LANGUAGE_CONFIG[options.language].label;
    const output = await createTextOutput(client, {
      model,
      instructions:
        `Write a concise summary in ${language}. Return two to four sentences of short Markdown. ` +
        "Describe the article's actual argument and conclusions without adding facts. " +
        "Return only the summary, without a heading, preamble, front matter, or enclosing code fence.",
      input:
        `Title:\n${options.title}\n\nArticle Markdown:\n${options.content}`,
    });
    const parsed = s.parseSafe(nonEmptyString, output);
    if (!parsed.success) {
      throw new Error("The model returned an empty summary.");
    }
    return parsed.value;
  }

  return {
    summarize,

    async translate(options) {
      const sourceLanguage = LANGUAGE_CONFIG[options.sourceLanguage].label;
      const targetLanguage = LANGUAGE_CONFIG[options.targetLanguage].label;
      const title = await createTextOutput(client, {
        model,
        instructions:
          `Translate the title from ${sourceLanguage} to ${targetLanguage}. ` +
          "Return only the translated title as plain text, without quotes, Markdown emphasis, or commentary.",
        input: options.title,
      });
      const content = await createTextOutput(client, {
        model,
        instructions:
          `Translate the article from ${sourceLanguage} to ${targetLanguage}. ` +
          "Translate headings, prose, image alt text, and reader-facing labels. " +
          "Preserve Markdown structure, links, URLs, code fences, inline code, raw HTML, math, and technical identifiers. " +
          "Return only the translated Markdown body, without front matter, commentary, or an enclosing code fence.",
        input: options.content,
      });
      const parsed = s.parseSafe(
        translationOutputSchema,
        {
          title,
          content,
          summary: await summarize({
            language: options.targetLanguage,
            title,
            content,
          }),
        },
      );
      if (!parsed.success) {
        throw new Error("The model returned an invalid translation payload.");
      }
      return parsed.value;
    },
  };
}

async function createTextOutput(
  client: OpenAI,
  options: {
    model: string;
    instructions: string;
    input: string;
  },
): Promise<string> {
  try {
    const response = await client.responses.create({
      model: options.model,
      instructions: options.instructions,
      input: options.input,
    });
    assertCompletedResponse(response);
    return response.output_text;
  } catch (error) {
    if (
      !(error instanceof OpenAI.APIError) ||
      (error.status !== 404 && error.status !== 405)
    ) throw error;
  }

  const completion = await client.chat.completions.create({
    model: options.model,
    messages: [
      { role: "system", content: options.instructions },
      { role: "user", content: options.input },
    ],
  });
  const choice = completion.choices[0];
  if (!choice) throw new Error("The model returned no chat completion.");
  if (choice.finish_reason === "length") {
    throw new Error("The chat completion was incomplete.");
  }
  if (choice.message.refusal) {
    throw new Error(`The model refused the request: ${choice.message.refusal}`);
  }
  if (!choice.message.content?.trim()) {
    throw new Error("The chat completion did not contain output text.");
  }
  return choice.message.content;
}

async function loadArticleFiles(directory: string): Promise<ArticleFiles[]> {
  const directories = await findPostDirectories(directory);
  const articles: ArticleFiles[] = [];
  for (const postDirectory of directories) {
    const variants = await readPostVariants(postDirectory);
    const source = variants.get(SOURCE_LANGUAGE);
    if (!source) {
      throw new Error(
        `Post directory is missing ${SOURCE_LANGUAGE}.md: ${postDirectory.path}`,
      );
    }
    articles.push({ directory: postDirectory, source, variants });
  }
  return articles;
}

async function processArticle(
  article: ArticleFiles,
  ai: ArticleAi,
  stagingDirectory: string,
): Promise<{
  generatedVariants: number;
  generatedSummaries: number;
  writtenFiles: number;
}> {
  const pendingWrites: PendingWrite[] = [];
  let generatedVariants = 0;
  let generatedSummaries = 0;
  const sourceTitle = postTitle(article.source, article.directory.slug);
  let sourceSummary = postSummary(article.source) ?? "";
  if (!sourceSummary) {
    sourceSummary = await ai.summarize({
      language: SOURCE_LANGUAGE,
      title: sourceTitle,
      content: article.source.body,
    });
    generatedSummaries += 1;
  }

  const sourceDates = postDates(article.source);
  const sourceAttrs = normalizedFrontMatter({
    attrs: article.source.attrs,
    title: sourceTitle,
    language: SOURCE_LANGUAGE,
    generated: postGenerated(article.source),
    summary: sourceSummary,
    ...sourceDates,
  });
  const sourceContent = serializePost(sourceAttrs, article.source.body);
  if (sourceContent !== article.source.raw) {
    pendingWrites.push({
      filePath: article.source.filePath,
      content: sourceContent,
    });
  }

  for (const language of SUPPORTED_LANGS) {
    if (language === SOURCE_LANGUAGE) continue;
    const existing = article.variants.get(language);
    if (existing) {
      const title = postTitle(existing, article.directory.slug);
      let summary = postSummary(existing) ?? "";
      if (!summary) {
        summary = await ai.summarize({
          language,
          title,
          content: existing.body,
        });
        generatedSummaries += 1;
      }
      const attrs = normalizedFrontMatter({
        attrs: existing.attrs,
        title,
        language,
        generated: postGenerated(existing),
        summary,
        ...postDates(existing),
      });
      const content = serializePost(attrs, existing.body);
      if (content !== existing.raw) {
        pendingWrites.push({ filePath: existing.filePath, content });
      }
      continue;
    }

    const translation = await ai.translate({
      sourceLanguage: SOURCE_LANGUAGE,
      targetLanguage: language,
      title: sourceTitle,
      content: article.source.body,
    });
    const attrs = normalizedFrontMatter({
      attrs: {},
      title: translation.title,
      language,
      generated: true,
      summary: translation.summary,
      ...sourceDates,
    });
    pendingWrites.push({
      filePath: postFilePath(article.directory, language),
      content: serializePost(attrs, translation.content),
    });
    generatedVariants += 1;
  }

  await commitArticleWrites(pendingWrites, stagingDirectory);
  return {
    generatedVariants,
    generatedSummaries,
    writtenFiles: pendingWrites.length,
  };
}

function normalizedFrontMatter(options: {
  attrs: PostFrontMatter;
  title: string;
  language: Lang;
  generated: boolean;
  summary: string;
  createdAt: string;
  updatedAt: string;
}): PostFrontMatter {
  return {
    ...options.attrs,
    title: options.title,
    language: options.language,
    generated: options.generated,
    summary: options.summary,
    createdAt: options.createdAt,
    updatedAt: options.updatedAt,
  };
}

async function commitArticleWrites(
  writes: readonly PendingWrite[],
  stagingDirectory: string,
): Promise<void> {
  if (writes.length === 0) return;

  const stage = join(stagingDirectory, crypto.randomUUID());
  await mkdir(stage, { recursive: true });
  try {
    const stagedFiles: { staged: string; target: string }[] = [];
    for (const [index, write] of writes.entries()) {
      const staged = join(stage, `${index}-${basename(write.filePath)}`);
      await writeFile(staged, write.content, "utf8");
      stagedFiles.push({ staged, target: write.filePath });
    }
    for (const file of stagedFiles) {
      await rename(file.staged, file.target);
    }
  } finally {
    await rm(stage, { recursive: true, force: true });
  }
}

function assertCompletedResponse(
  response: OpenAI.Responses.Response,
): void {
  for (const item of response.output) {
    if (item.type !== "message") continue;
    for (const content of item.content) {
      if (content.type === "refusal") {
        throw new Error(`The model refused the request: ${content.refusal}`);
      }
    }
  }

  if (response.status !== "completed") {
    const reason = response.incomplete_details?.reason ?? response.status;
    throw new Error(`The model response was not completed: ${reason}`);
  }
  if (!response.output_text.trim()) {
    throw new Error("The model response did not contain output text.");
  }
}

async function main(): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.OPENAI_MODEL?.trim();
  const baseURL = process.env.OPENAI_BASE_URL?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is required.");
  if (!model) throw new Error("OPENAI_MODEL is required.");

  const client = new OpenAI({
    apiKey,
    adminAPIKey: null,
    baseURL: normalizeOpenAiBaseURL(baseURL),
    organization: null,
    project: null,
    webhookSecret: null,
    logLevel: "warn",
  });
  const result = await processPosts({
    ai: createOpenAiArticleAi(client, model),
  });
  console.log(
    `[posts:translate] ${result.articles} article(s), ${result.writtenFiles} file(s) updated, ` +
      `${result.generatedVariants} translation(s), ${result.generatedSummaries} summary(s), ` +
      `${result.failedArticles} failure(s)`,
  );
  if (result.failedArticles > 0) process.exitCode = 1;
}

if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[posts:translate] ${message}`);
    process.exitCode = 1;
  }
}
