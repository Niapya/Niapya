import type { Stats } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { extractYaml } from "@std/front-matter";
import { stringify } from "@std/yaml";

import { type Lang, SUPPORTED_LANGS } from "@/i18n/index.ts";
import { slug } from "@/utils/slug.ts";

export const SOURCE_LANGUAGE: Lang = "zh-cn";

const DATA_DIRECTORY = import.meta.dirname ??
  dirname(fileURLToPath(import.meta.url));

export const POSTS_DIRECTORY = join(DATA_DIRECTORY, "../posts");

export type FrontMatterValue =
  | string
  | number
  | boolean
  | null
  | Date
  | FrontMatterValue[]
  | { [key: string]: FrontMatterValue };

export type PostFrontMatter = { [key: string]: FrontMatterValue };

export type PostDirectory = {
  slug: string;
  path: string;
};

export type PostFile = {
  attrs: PostFrontMatter;
  body: string;
  filePath: string;
  metadata: Stats;
  raw: string;
};

export async function findPostDirectories(
  root = POSTS_DIRECTORY,
): Promise<PostDirectory[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const directories: PostDirectory[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (!entry.name || slug(entry.name) !== entry.name) {
      throw new Error(
        `Post directory must use a canonical slug: ${entry.name}`,
      );
    }
    directories.push({ slug: entry.name, path: join(root, entry.name) });
  }

  return directories.sort((left, right) => left.slug.localeCompare(right.slug));
}

export async function readPostVariants(
  directory: PostDirectory,
): Promise<Map<Lang, PostFile>> {
  const entries = await readdir(directory.path, { withFileTypes: true });
  const variants = new Map<Lang, PostFile>();

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
    const language = SUPPORTED_LANGS.find((candidate) =>
      entry.name === `${candidate}.md`
    );
    if (!language) {
      throw new Error(`Unsupported post language file: ${entry.name}`);
    }
    const file = await readPostFile(join(directory.path, entry.name));
    const frontMatterLanguage = file.attrs.language;
    if (
      frontMatterLanguage !== undefined && frontMatterLanguage !== language
    ) {
      throw new Error(
        `Post language does not match its filename: ${file.filePath}`,
      );
    }
    variants.set(language, file);
  }

  return variants;
}

export function postFilePath(
  directory: PostDirectory,
  language: Lang,
): string {
  return join(directory.path, `${language}.md`);
}

export function postTitle(file: PostFile, fallback: string): string {
  const title = file.attrs.title;
  return typeof title === "string" && title.trim() ? title.trim() : fallback;
}

export function postSummary(file: PostFile): string | undefined {
  const summary = file.attrs.summary;
  return typeof summary === "string" && summary.trim()
    ? summary.trim()
    : undefined;
}

export function postGenerated(file: PostFile): boolean {
  return typeof file.attrs.generated === "boolean"
    ? file.attrs.generated
    : false;
}

export function postDates(file: PostFile): {
  createdAt: string;
  updatedAt: string;
} {
  const rawCreatedAt = file.attrs.createdAt;
  const createdFallback = file.metadata.birthtimeMs > 0
    ? file.metadata.birthtime
    : file.metadata.ctime;
  const createdAt = rawCreatedAt instanceof Date ||
      typeof rawCreatedAt === "string"
    ? new Date(rawCreatedAt)
    : createdFallback;

  const rawUpdatedAt = file.attrs.updatedAt;
  const updatedAt = rawUpdatedAt instanceof Date ||
      typeof rawUpdatedAt === "string"
    ? new Date(rawUpdatedAt)
    : file.metadata.mtime;

  return {
    createdAt: Number.isNaN(createdAt.getTime())
      ? createdFallback.toISOString()
      : createdAt.toISOString(),
    updatedAt: Number.isNaN(updatedAt.getTime())
      ? file.metadata.mtime.toISOString()
      : updatedAt.toISOString(),
  };
}

export function serializePost(
  attrs: PostFrontMatter,
  body: string,
): string {
  const normalizedBody = body.replace(/^\n+/, "").replace(/\s*$/, "\n");
  return `---\n${stringify(attrs).trimEnd()}\n---\n\n${normalizedBody}`;
}

async function readPostFile(filePath: string): Promise<PostFile> {
  const [raw, metadata] = await Promise.all([
    readFile(filePath, "utf8"),
    stat(filePath),
  ]);
  const { attrs, body } = extractYaml<PostFrontMatter>(raw);
  return { attrs, body, filePath, metadata, raw };
}
