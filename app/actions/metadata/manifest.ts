import { SITE_METADATA } from "../../constants.ts";
import { getLangFromRequest, LANGUAGE_CONFIG } from "../../i18n/index.ts";

export function manifest({ request }: { request: Request }) {
  const lang = getLangFromRequest(request);
  const language = LANGUAGE_CONFIG[lang];

  return new Response(
    JSON.stringify({
      name: SITE_METADATA.title[lang],
      short_name: SITE_METADATA.siteName,
      description: SITE_METADATA.description[lang],
      lang: language.htmlLang,
      dir: language.direction,
      start_url: "/",
      display: "standalone",
      theme_color: SITE_METADATA.themeColor,
      background_color: SITE_METADATA.themeColor,
      icons: [{
        src: SITE_METADATA.favicon,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable",
      }],
    }),
    {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "Content-Type": "application/manifest+json; charset=utf-8",
        Vary: "Accept-Language",
      },
    },
  );
}
