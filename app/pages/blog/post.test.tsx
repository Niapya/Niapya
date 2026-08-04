import assert from "node:assert/strict";

import { renderToString } from "remix/ui/server";

import { EMPTY_COMMENT_FORM } from "@/constants/index.ts";
import { createI18n } from "@/i18n/index.ts";
import type { Post } from "@/data/posts.ts";
import { BlogPostPage } from "./post.tsx";

const generatedPost: Post = {
  slug: "translated-article",
  language: "en",
  title: "Translated article",
  content: "## Main point\n\nTranslated body.",
  summary: "A **concise** AI summary.",
  generated: true,
  createdAt: "2026-07-27T03:25:00.000Z",
  updatedAt: "2026-07-27T04:10:00.000Z",
};

Deno.test("generated article page renders summary and language versions", async () => {
  const html = await renderToString(
    <BlogPostPage
      i18n={createI18n("en")}
      post={generatedPost}
      availableLanguages={["en", "zh-cn"]}
      fallback={false}
      previousPost={undefined}
      nextPost={undefined}
      comments={[]}
      values={EMPTY_COMMENT_FORM}
      errors={{}}
      published={false}
      shareUrl="https://niapya.test/blog/translated-article?lang=en"
    />,
  );

  assert.match(html, /<article lang="en">/);
  assert.match(html, /AI-generated translation/);
  assert.match(html, /AI summary/);
  assert.match(html, /A <strong>concise<\/strong> AI summary\./);
  assert.match(html, /aria-label="Article languages"/);
  assert.match(html, /translated-article\?lang=zh-cn/);
});

Deno.test("fallback article page names the displayed language", async () => {
  const sourcePost: Post = {
    ...generatedPost,
    language: "zh-cn",
    title: "中文文章",
    content: "中文正文。",
    summary: undefined,
    generated: false,
  };
  const html = await renderToString(
    <BlogPostPage
      i18n={createI18n("en")}
      post={sourcePost}
      availableLanguages={["zh-cn"]}
      fallback
      previousPost={undefined}
      nextPost={undefined}
      comments={[]}
      values={EMPTY_COMMENT_FORM}
      errors={{}}
      published={false}
      shareUrl="https://niapya.test/blog/translated-article?lang=en"
    />,
  );

  assert.match(html, /<article lang="zh-CN">/);
  assert.match(
    html,
    /The requested language is unavailable\. Showing 简体中文\./,
  );
  assert.doesNotMatch(html, /AI-generated translation/);
});
