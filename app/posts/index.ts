import type { Stats } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { slug } from "@/utils/slug.ts";

export type Post = {
  slug: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

const POSTS_DIRECTORY = import.meta.dirname ??
  dirname(fileURLToPath(import.meta.url));

export const posts = await loadPosts();

export const allPosts = Object.values(posts).sort((left, right) =>
  right.updatedAt.localeCompare(left.updatedAt)
);

async function loadPosts(): Promise<Record<string, Post>> {
  const filePaths = await findMarkdownFiles(POSTS_DIRECTORY);
  const loadedPosts = await Promise.all(filePaths.map(loadPost));
  const registry: Record<string, Post> = {};

  for (const post of loadedPosts) {
    if (registry[post.slug]) {
      throw new Error(`Duplicate blog post slug: ${post.slug}`);
    }
    registry[post.slug] = post;
  }

  return registry;
}

async function findMarkdownFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  return entries.filter((entry) =>
    entry.isFile() && extname(entry.name).toLowerCase() === ".md"
  ).map((entry) => join(directory, entry.name)).sort();
}

async function loadPost(filePath: string): Promise<Post> {
  const [content, metadata] = await Promise.all([
    readFile(filePath, "utf8"),
    stat(filePath),
  ]);
  const filename = basename(filePath, extname(filePath));
  const postSlug = slug(filename);
  if (!postSlug) {
    throw new Error(`Blog post filename has no valid slug: ${filePath}`);
  }

  return {
    slug: postSlug,
    title: titleFromPathSegment(filename),
    content,
    createdAt: createdTime(metadata).toISOString(),
    updatedAt: metadata.mtime.toISOString(),
  };
}

function createdTime(metadata: Stats): Date {
  return metadata.birthtimeMs > 0 ? metadata.birthtime : metadata.ctime;
}

function titleFromPathSegment(value: string): string {
  return value.replace(/[-_]+/gu, " ").replace(/\s+/gu, " ").trim();
}
