import assert from "node:assert/strict";

import {
  type Article,
  articleLanguages,
  type Post,
  selectPost,
} from "./posts.ts";

function variant(language: Post["language"], title: string): Post {
  return {
    slug: "article",
    language,
    title,
    content: `${title} content`,
    summary: undefined,
    generated: language === "en",
    createdAt: "2026-07-27T03:25:00.000Z",
    updatedAt: "2026-07-27T04:10:00.000Z",
  };
}

function article(variants: readonly Post[]): Article {
  return {
    slug: "article",
    variants: new Map(variants.map((post) => [post.language, post])),
    createdAt: "2026-07-27T03:25:00.000Z",
    updatedAt: "2026-07-27T04:10:00.000Z",
  };
}

Deno.test("selectPost uses the requested language and falls back to source", () => {
  const source = variant("zh-cn", "中文标题");
  const english = variant("en", "English title");
  const grouped = article([source, english]);

  assert.deepEqual(selectPost(grouped, "en"), {
    post: english,
    fallback: false,
  });
  assert.deepEqual(selectPost(grouped, "zh-cn"), {
    post: source,
    fallback: false,
  });
  assert.deepEqual(articleLanguages(grouped), ["en", "zh-cn"]);
});

Deno.test("selectPost falls back to Chinese when a language is unavailable", () => {
  const source = variant("zh-cn", "中文标题");
  const grouped = article([source]);
  const selected = selectPost(grouped, "en");

  assert.equal(selected.post, source);
  assert.equal(selected.fallback, true);
  assert.deepEqual(articleLanguages(grouped), ["zh-cn"]);
});
