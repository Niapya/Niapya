import { SITE_METADATA } from "@/constants/index.ts";

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
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "Content-Type": "text/plain; charset=utf-8",
      },
    },
  );
}
