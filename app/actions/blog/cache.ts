import { noStore } from "@/actions/http.ts";
import { cachePolicies, invalidateCacheTags } from "@/lib/cache.ts";
import { usesAcceptLanguage } from "@/i18n/index.ts";

const BLOG_POST_TAG_PREFIX = "blog-post-";
const { content: contentCache } = cachePolicies;

export function blogPostCacheTag(slug: string): string {
  return `${BLOG_POST_TAG_PREFIX}${encodeURIComponent(slug)}`;
}

export function blogPostResponseInit(
  request: Request,
  url: URL,
  slug: string,
): ResponseInit {
  if (
    url.searchParams.has("commented") ||
    url.searchParams.has("verification")
  ) return noStore();

  return {
    headers: contentCache({
      tags: [blogPostCacheTag(slug)],
      vary: usesAcceptLanguage(request) ? "Accept-Language" : undefined,
    }).headers,
  };
}

export function invalidateBlogPostCache(slug: string): Promise<void> {
  return invalidateCacheTags([blogPostCacheTag(slug)]);
}
