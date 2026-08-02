import { SITE_METADATA } from "@/constants/index.ts";
import { cachePolicies } from "@/lib/cache.ts";

const { public: publicCache } = cachePolicies;

export function robots({ request }: { request: Request }) {
  const origin = new URL(request.url).origin;
  const sitemap = new URL(SITE_METADATA.sitemap, origin).href;

  return new Response(
    [
      "User-agent: *",
      "Allow: /",
      `Sitemap: ${sitemap}`,
      "",
    ].join("\n"),
    {
      headers: publicCache({
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      }).headers,
    },
  );
}
