import assert from "node:assert/strict";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

import {
  postDates,
  postGenerated,
  postSummary,
  postTitle,
  readPostVariants,
} from "@/data/post-files.ts";
import { createPost } from "./posts.ts";

async function fixtureDirectory(): Promise<string> {
  const directory = join(".tmp", `posts-test-${crypto.randomUUID()}`);
  await mkdir(directory, { recursive: true });
  return directory;
}

Deno.test("createPost creates a Chinese source file in a slug directory", async () => {
  const postsDirectory = await fixtureDirectory();
  const now = new Date("2026-08-03T12:00:00.000Z");
  try {
    const created = await createPost({
      title: "一篇 New Post",
      postsDirectory,
      now,
    });
    const variants = await readPostVariants(created.directory);
    const source = variants.get("zh-cn");

    assert.equal(created.directory.slug, "一篇-new-post");
    assert.equal(created.filePath, join(created.directory.path, "zh-cn.md"));
    assert.ok(source);
    assert.equal(postTitle(source, "fallback"), "一篇 New Post");
    assert.equal(postGenerated(source), false);
    assert.equal(postSummary(source), undefined);
    assert.deepEqual(postDates(source), {
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  } finally {
    await rm(postsDirectory, { recursive: true, force: true });
  }
});

Deno.test("createPost refuses to overwrite an existing slug", async () => {
  const postsDirectory = await fixtureDirectory();
  try {
    await createPost({ title: "Existing Post", postsDirectory });
    await assert.rejects(
      createPost({ title: "Existing Post", postsDirectory }),
      /Post already exists: existing-post/,
    );
  } finally {
    await rm(postsDirectory, { recursive: true, force: true });
  }
});
