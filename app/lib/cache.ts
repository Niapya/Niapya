import { log } from "@/lib/log.ts";

const CACHE_INVALIDATION_URL = "http://cache.localhost/invalidate/http";

const cachePolicyDefinitions = {
  public: {
    "Cache-Control": "public, max-age=3600",
    "Deno-CDN-Cache-Control":
      "public, s-maxage=86400, stale-while-revalidate=86400",
  },
  static: {
    "Cache-Control":
      "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
  },
  content: {
    "Cache-Control": "public, max-age=60",
    "Deno-CDN-Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
  },
};

type CacheKind = keyof typeof cachePolicyDefinitions;

export type CacheOptions = {
  tags?: readonly string[];
  headers?: HeadersInit;
  vary?: string;
};

export const cachePolicies = {
  public: (options?: CacheOptions) => createCache("public", options),
  static: (options?: CacheOptions) => createCache("static", options),
  content: (options?: CacheOptions) => createCache("content", options),
};

export function createCache(
  kind: CacheKind,
  options: CacheOptions = {},
) {
  const tags = options.tags ?? [];
  const policy = cachePolicyDefinitions[kind];
  const headers = new Headers(policy);
  for (const [name, value] of new Headers(options.headers)) {
    headers.set(name, value);
  }
  if (tags.length > 0) headers.set("Deno-Cache-Tag", tags.join(","));
  if (options.vary) {
    const existingVary = headers.get("Vary");
    headers.set(
      "Vary",
      existingVary ? `${existingVary}, ${options.vary}` : options.vary,
    );
  }

  return {
    headers,
    cacheControl: policy["Cache-Control"],
  };
}

export async function invalidateCacheTags(
  tags: readonly string[],
): Promise<void> {
  if (tags.length === 0) return;

  try {
    const response = await fetch(CACHE_INVALIDATION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags }),
      signal: AbortSignal.timeout(1_000),
    });

    if (!response.ok) {
      log.warn("Cache invalidation failed", {
        status: response.status,
        tags,
      });
    }
  } catch (error) {
    log.warn("Cache invalidation unavailable", {
      error: error instanceof Error ? error.message : String(error),
      tags,
    });
  }
}
