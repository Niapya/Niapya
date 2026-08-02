import type { Stats } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { extractYaml } from "@std/front-matter";

import { slug } from "@/utils/slug.ts";

export type Post = {
  slug: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

type PostFrontMatter = {
  title?: string;
  createdAt?: string;
  updatedAt?: string;
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
  const [raw, metadata] = await Promise.all([
    readFile(filePath, "utf8"),
    stat(filePath),
  ]);
  const { attrs, body } = extractYaml<PostFrontMatter>(raw);
  const filename = basename(filePath, extname(filePath));
  const postSlug = slug(filename);
  if (!postSlug) {
    throw new Error(`Blog post filename has no valid slug: ${filePath}`);
  }

  return {
    slug: postSlug,
    title: attrs.title ?? titleFromPathSegment(filename),
    content: body,
    createdAt: dateFromFrontMatter(attrs.createdAt, createdTime(metadata)),
    updatedAt: dateFromFrontMatter(attrs.updatedAt, metadata.mtime),
  };
}

function dateFromFrontMatter(
  value: string | undefined,
  fallback: Date,
): string {
  if (!value) return fallback.toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? fallback.toISOString()
    : date.toISOString();
}

function createdTime(metadata: Stats): Date {
  return metadata.birthtimeMs > 0 ? metadata.birthtime : metadata.ctime;
}

function titleFromPathSegment(value: string): string {
  return value.replace(/[-_]+/gu, " ").replace(/\s+/gu, " ").trim();
}
