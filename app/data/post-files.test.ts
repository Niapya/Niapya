import assert from "node:assert/strict";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import {
  findPostDirectories,
  postFilePath,
  readPostVariants,
  serializePost,
} from "./post-files.ts";

async function fixtureDirectory(): Promise<string> {
  const directory = join(
    ".tmp",
    `post-files-test-${crypto.randomUUID()}`,
  );
  await mkdir(directory, { recursive: true });
  return directory;
}

Deno.test("post directories use canonical slugs", async () => {
  const root = await fixtureDirectory();
  try {
    await mkdir(join(root, "canonical-post"));
    assert.deepEqual(await findPostDirectories(root), [{
      slug: "canonical-post",
      path: join(root, "canonical-post"),
    }]);

    await mkdir(join(root, "Not Canonical"));
    await assert.rejects(
      findPostDirectories(root),
      /Post directory must use a canonical slug: Not Canonical/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

Deno.test("post variants map language filenames and validate front matter", async () => {
  const root = await fixtureDirectory();
  const directory = {
    slug: "article",
    path: join(root, "article"),
  };
  try {
    await mkdir(directory.path);
    await Promise.all([
      writeFile(
        postFilePath(directory, "zh-cn"),
        serializePost({ title: "文章", language: "zh-cn" }, "中文正文。"),
      ),
      writeFile(
        postFilePath(directory, "en"),
        serializePost({ title: "Article", language: "en" }, "Body."),
      ),
    ]);

    const variants = await readPostVariants(directory);
    assert.deepEqual(Array.from(variants.keys()), ["en", "zh-cn"]);
    assert.equal(variants.get("en")?.body, "Body.\n");

    await writeFile(
      postFilePath(directory, "en"),
      serializePost({ language: "zh-cn" }, "Body."),
    );
    await assert.rejects(
      readPostVariants(directory),
      /Post language does not match its filename/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

Deno.test("post serialization preserves custom front matter", () => {
  const serialized = serializePost(
    {
      title: "Article",
      language: "en",
      generated: true,
      custom: ["preserved"],
    },
    "\nBody.\n\n",
  );

  assert.ok(serialized.includes("custom:\n  - preserved"));
  assert.match(serialized, /---\n\nBody\.\n$/);
});
