import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";

import {
  findPostDirectories,
  type PostDirectory,
  postFilePath,
  POSTS_DIRECTORY,
  serializePost,
  SOURCE_LANGUAGE,
} from "@/data/post-files.ts";
import { slug } from "@/utils/slug.ts";

export type CreatedPost = {
  directory: PostDirectory;
  filePath: string;
};

export async function createPost(options: {
  title: string;
  postsDirectory?: string;
  now?: Date;
}): Promise<CreatedPost> {
  const title = options.title.trim();
  if (!title) throw new Error("Post title is required.");

  const postSlug = slug(title);
  if (!postSlug) throw new Error("Post title must contain letters or numbers.");

  const postsDirectory = options.postsDirectory ?? POSTS_DIRECTORY;
  const existing = await findPostDirectories(postsDirectory);
  if (existing.some((directory) => directory.slug === postSlug)) {
    throw new Error(`Post already exists: ${postSlug}`);
  }

  const directory = {
    slug: postSlug,
    path: join(postsDirectory, postSlug),
  };
  const filePath = postFilePath(directory, SOURCE_LANGUAGE);
  const timestamp = (options.now ?? new Date()).toISOString();
  const content = serializePost(
    {
      title,
      createdAt: timestamp,
      updatedAt: timestamp,
      language: SOURCE_LANGUAGE,
      generated: false,
      summary: "",
    },
    "",
  );

  await mkdir(directory.path);
  await writeFile(filePath, content, { encoding: "utf8", flag: "wx" });
  return { directory, filePath };
}

async function main(): Promise<void> {
  const [command, ...titleParts] = process.argv.slice(2);
  if (command !== "new") {
    throw new Error('Usage: deno task posts new ["Post title"]');
  }

  const argumentTitle = titleParts.join(" ").trim();
  const title = argumentTitle || prompt("Post title:")?.trim();
  if (!title) throw new Error("Post title is required.");

  const created = await createPost({ title });
  console.log(`[posts:new] Created ${created.filePath}`);
}

if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[posts] ${message}`);
    process.exitCode = 1;
  }
}
