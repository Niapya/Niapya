import assert from "node:assert/strict";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import OpenAI from "openai";

import {
  type ArticleAi,
  createOpenAiArticleAi,
  normalizeOpenAiBaseURL,
  processPosts,
} from "./translate-posts.ts";

function article(
  title: string,
  body: string,
  extra = "",
): string {
  return `---
title: ${title}
createdAt: 2026-07-27T03:25:00.000Z
updatedAt: 2026-07-27T04:10:00.000Z
${extra}---

${body}
`;
}

async function fixtureDirectory(): Promise<string> {
  const directory = join(
    ".tmp",
    `translate-posts-test-${crypto.randomUUID()}`,
  );
  await mkdir(directory, { recursive: true });
  return directory;
}

Deno.test("OpenAI base URL adds the standard API path when omitted", () => {
  assert.equal(
    normalizeOpenAiBaseURL("https://ollama.com"),
    "https://ollama.com/v1",
  );
  assert.equal(
    normalizeOpenAiBaseURL("http://localhost:11434/v1/"),
    "http://localhost:11434/v1/",
  );
  assert.equal(normalizeOpenAiBaseURL(undefined), undefined);
});

Deno.test("translation processing fills summaries and missing variants", async () => {
  const directory = await fixtureDirectory();
  try {
    const postDirectory = join(directory, "article");
    await mkdir(postDirectory);
    await writeFile(
      join(postDirectory, "zh-cn.md"),
      article("文章", "中文正文。", "custom: preserved\n"),
    );
    const ai: ArticleAi = {
      summarize({ language }) {
        return Promise.resolve(
          language === "zh-cn" ? "中文摘要。" : "Summary.",
        );
      },
      translate() {
        return Promise.resolve({
          title: "Article",
          content: "English body.",
          summary: "English summary.",
        });
      },
    };

    const result = await processPosts({
      ai,
      postsDirectory: directory,
      stagingDirectory: join(directory, ".stage"),
    });
    const source = await readFile(join(postDirectory, "zh-cn.md"), "utf8");
    const translation = await readFile(
      join(postDirectory, "en.md"),
      "utf8",
    );

    assert.equal(result.failedArticles, 0);
    assert.equal(result.generatedSummaries, 1);
    assert.equal(result.generatedVariants, 1);
    assert.match(source, /language: zh-cn/);
    assert.match(source, /generated: false/);
    assert.match(source, /summary: 中文摘要。/);
    assert.match(source, /custom: preserved/);
    assert.match(source, /中文正文。/);
    assert.match(translation, /language: en/);
    assert.match(translation, /generated: true/);
    assert.match(translation, /summary: English summary\./);
    assert.match(translation, /English body\./);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

Deno.test("manual translations keep their title and body", async () => {
  const directory = await fixtureDirectory();
  try {
    const postDirectory = join(directory, "article");
    await mkdir(postDirectory);
    await writeFile(
      join(postDirectory, "zh-cn.md"),
      article("文章", "中文正文。", "summary: 中文摘要。\n"),
    );
    await writeFile(
      join(postDirectory, "en.md"),
      article("Handwritten title", "Handwritten body."),
    );
    let translations = 0;
    const ai: ArticleAi = {
      summarize() {
        return Promise.resolve("Generated English summary.");
      },
      translate() {
        translations += 1;
        return Promise.resolve({
          title: "Wrong",
          content: "Wrong",
          summary: "Wrong",
        });
      },
    };

    const result = await processPosts({
      ai,
      postsDirectory: directory,
      stagingDirectory: join(directory, ".stage"),
    });
    const translation = await readFile(
      join(postDirectory, "en.md"),
      "utf8",
    );

    assert.equal(result.failedArticles, 0);
    assert.equal(translations, 0);
    assert.match(translation, /title: Handwritten title/);
    assert.match(translation, /generated: false/);
    assert.match(translation, /summary: Generated English summary\./);
    assert.match(translation, /Handwritten body\./);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

Deno.test("one failed article does not prevent another from being written", async () => {
  const directory = await fixtureDirectory();
  try {
    const failedDirectory = join(directory, "failed");
    const successfulDirectory = join(directory, "successful");
    await Promise.all([
      mkdir(failedDirectory),
      mkdir(successfulDirectory),
    ]);
    await Promise.all([
      writeFile(
        join(failedDirectory, "zh-cn.md"),
        article("失败", "失败正文。"),
      ),
      writeFile(
        join(successfulDirectory, "zh-cn.md"),
        article("成功", "成功正文。"),
      ),
    ]);
    const ai: ArticleAi = {
      summarize({ title }) {
        if (title === "失败") throw new Error("model unavailable");
        return Promise.resolve("摘要。");
      },
      translate() {
        return Promise.resolve({
          title: "Success",
          content: "Successful body.",
          summary: "Summary.",
        });
      },
    };

    const result = await processPosts({
      ai,
      postsDirectory: directory,
      stagingDirectory: join(directory, ".stage"),
    });

    assert.equal(result.failedArticles, 1);
    assert.equal(result.generatedVariants, 1);
    await assert.rejects(readFile(join(failedDirectory, "en.md"), "utf8"));
    assert.match(
      await readFile(join(successfulDirectory, "en.md"), "utf8"),
      /Successful body\./,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

Deno.test("OpenAI client falls back when the Responses endpoint is unavailable", async () => {
  const requestedPaths: string[] = [];
  const client = new OpenAI({
    apiKey: "test-key",
    adminAPIKey: null,
    baseURL: "https://openai.test/v1",
    organization: null,
    project: null,
    webhookSecret: null,
    logLevel: "warn",
    fetch(input) {
      const url = input instanceof Request ? input.url : String(input);
      requestedPaths.push(new URL(url).pathname);
      if (url.endsWith("/responses")) {
        return Promise.resolve(
          new Response("Method Not Allowed", { status: 405 }),
        );
      }
      return Promise.resolve(Response.json({
        id: "chatcmpl-test",
        object: "chat.completion",
        created: 0,
        model: "test-model",
        choices: [{
          index: 0,
          finish_reason: "stop",
          logprobs: null,
          message: {
            role: "assistant",
            content: "Fallback summary.",
            refusal: null,
          },
        }],
        usage: {
          prompt_tokens: 1,
          completion_tokens: 1,
          total_tokens: 2,
        },
      }));
    },
  });

  const summary = await createOpenAiArticleAi(client, "test-model").summarize({
    language: "en",
    title: "Article",
    content: "Body",
  });

  assert.equal(summary, "Fallback summary.");
  assert.deepEqual(requestedPaths, ["/v1/responses", "/v1/chat/completions"]);
});

Deno.test("translation uses separate text calls for title, body, and summary", async () => {
  const chatOutputs = ["English title", "English body.", "English summary."];
  const requestedPaths: string[] = [];
  const client = new OpenAI({
    apiKey: "test-key",
    adminAPIKey: null,
    baseURL: "https://openai.test/v1",
    organization: null,
    project: null,
    webhookSecret: null,
    logLevel: "warn",
    fetch(input) {
      const url = input instanceof Request ? input.url : String(input);
      requestedPaths.push(new URL(url).pathname);
      if (url.endsWith("/responses")) {
        return Promise.resolve(
          new Response("Method Not Allowed", { status: 405 }),
        );
      }
      const content = chatOutputs.shift();
      return Promise.resolve(Response.json({
        id: "chatcmpl-test",
        object: "chat.completion",
        created: 0,
        model: "test-model",
        choices: [{
          index: 0,
          finish_reason: "stop",
          logprobs: null,
          message: { role: "assistant", content, refusal: null },
        }],
        usage: {
          prompt_tokens: 1,
          completion_tokens: 1,
          total_tokens: 2,
        },
      }));
    },
  });

  const translation = await createOpenAiArticleAi(
    client,
    "test-model",
  ).translate({
    sourceLanguage: "zh-cn",
    targetLanguage: "en",
    title: "中文标题",
    content: "中文正文。",
  });

  assert.deepEqual(translation, {
    title: "English title",
    content: "English body.",
    summary: "English summary.",
  });
  assert.deepEqual(requestedPaths, [
    "/v1/responses",
    "/v1/chat/completions",
    "/v1/responses",
    "/v1/chat/completions",
    "/v1/responses",
    "/v1/chat/completions",
  ]);
});
