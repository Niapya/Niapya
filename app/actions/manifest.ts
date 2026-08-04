import { SITE_METADATA } from "@/constants/index.ts";
import { cachePolicies } from "@/lib/cache.ts";
import {
  getLangFromRequest,
  LANGUAGE_CONFIG,
  usesAcceptLanguage,
} from "@/i18n/index.ts";

const { public: publicCache } = cachePolicies;

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
        sizes: "460x460",
        type: "image/jpeg",
        purpose: "any",
      }],
    }),
    {
      headers: publicCache({
        vary: usesAcceptLanguage(request) ? "Accept-Language" : undefined,
        headers: {
          "Content-Type": "application/manifest+json; charset=utf-8",
        },
      }).headers,
    },
  );
}
