import { type Lang, SUPPORTED_LANGS } from "@/i18n/index.ts";
import {
  findPostDirectories,
  postDates,
  postGenerated,
  postSummary,
  postTitle,
  readPostVariants,
  SOURCE_LANGUAGE,
} from "./post-files.ts";

export type Post = {
  slug: string;
  language: Lang;
  title: string;
  content: string;
  summary: string | undefined;
  generated: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Article = {
  slug: string;
  variants: ReadonlyMap<Lang, Post>;
  createdAt: string;
  updatedAt: string;
};

export type SelectedPost = {
  post: Post;
  fallback: boolean;
};

export const posts = await loadPosts();

export const allPosts = Array.from(posts.values()).sort((left, right) =>
  right.updatedAt.localeCompare(left.updatedAt)
);

export type PostNeighbors = {
  previous: Post | undefined;
  next: Post | undefined;
};

/** Returns adjacent localized posts around `slug` (previous is the newer entry above). */
export function postNeighbors(slug: string, lang: Lang): PostNeighbors {
  const index = allPosts.findIndex((article) => article.slug === slug);
  if (index < 0) return { previous: undefined, next: undefined };

  const previousArticle = allPosts[index - 1];
  const nextArticle = allPosts[index + 1];
  return {
    previous: previousArticle
      ? selectPost(previousArticle, lang).post
      : undefined,
    next: nextArticle ? selectPost(nextArticle, lang).post : undefined,
  };
}

export function selectPost(article: Article, lang: Lang): SelectedPost {
  const exact = article.variants.get(lang);
  if (exact) return { post: exact, fallback: false };

  const source = article.variants.get(SOURCE_LANGUAGE);
  if (source) return { post: source, fallback: true };

  const first = article.variants.values().next().value;
  if (!first) {
    throw new Error(`Article has no language variants: ${article.slug}`);
  }
  return { post: first, fallback: true };
}

export function articleLanguages(article: Article): Lang[] {
  return SUPPORTED_LANGS.filter((language) => article.variants.has(language));
}

async function loadPosts(): Promise<Map<string, Article>> {
  const directories = await findPostDirectories();
  const registry = new Map<string, Article>();

  for (const directory of directories) {
    const files = await readPostVariants(directory);
    const variants = new Map<Lang, Post>();
    for (const [language, file] of files) {
      const dates = postDates(file);
      variants.set(language, {
        slug: directory.slug,
        language,
        title: postTitle(file, directory.slug),
        content: file.body,
        summary: postSummary(file),
        generated: postGenerated(file),
        ...dates,
      });
    }

    const source = variants.get(SOURCE_LANGUAGE) ??
      variants.values().next().value;
    if (!source) {
      throw new Error(
        `Post directory has no language files: ${directory.path}`,
      );
    }
    registry.set(directory.slug, {
      slug: directory.slug,
      variants,
      createdAt: source.createdAt,
      updatedAt: source.updatedAt,
    });
  }

  return registry;
}
