import { noStore } from "@/actions/http.ts";
import { cachePolicies, invalidateCacheTags } from "@/lib/cache.ts";
import { usesAcceptLanguage } from "@/i18n/index.ts";

const COMMENTS_CACHE_TAG = "comments";
const { content: contentCache } = cachePolicies;

export function commentsPageResponseInit(
  request: Request,
  url: URL,
): ResponseInit {
  if (
    url.searchParams.has("posted") ||
    url.searchParams.has("verification")
  ) return noStore();

  return {
    headers: contentCache({
      tags: [COMMENTS_CACHE_TAG],
      vary: usesAcceptLanguage(request) ? "Accept-Language" : undefined,
    }).headers,
  };
}

export function invalidateCommentsCache(): Promise<void> {
  return invalidateCacheTags([COMMENTS_CACHE_TAG]);
}
