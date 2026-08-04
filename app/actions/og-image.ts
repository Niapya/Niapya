import { Resvg } from "@resvg/resvg-js";
import { maxLength } from "remix/data-schema/checks";
import * as f from "remix/data-schema/form-data";
import * as s from "remix/data-schema";
import { redirect } from "remix/response/redirect";
import satori from "satori";

import { SITE_METADATA } from "@/constants/index.ts";
import { cachePolicies } from "@/lib/cache.ts";
import { RENDER_FONT_DATA } from "@/lib/render-fonts.ts";
import {
  getLangFromRequest,
  type Lang,
  LANGUAGE_CONFIG,
  t,
  usesAcceptLanguage,
} from "@/i18n/index.ts";
import { allPosts, selectPost } from "@/data/posts.ts";

const WIDTH = 1200;
const HEIGHT = 630;
const { public: publicCache } = cachePolicies;

const ogImageQuerySchema = f.object({
  title: f.field(s.defaulted(s.string().pipe(maxLength(120)), "")),
});

function textNode(text: string, style: Record<string, string | number>) {
  return {
    type: "div",
    props: { style, children: text },
  };
}

function createCard(lang: Lang, title: string) {
  const language = LANGUAGE_CONFIG[lang];
  const fontFamily = lang === "zh-cn" ? "Noto Serif SC" : "Instrument Serif";

  return {
    type: "div",
    props: {
      lang: language.htmlLang,
      style: {
        position: "relative",
        width: WIDTH,
        height: HEIGHT,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        backgroundColor: "#f8fafb",
        backgroundImage:
          "linear-gradient(to bottom left, #2879be 0%, #86b6d3 30%, #e5edef 68%, #ffffff 100%)",
        color: "#171717",
        fontFamily,
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              width: 940,
              minHeight: 340,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "64px 80px 58px",
            },
            children: [
              textNode(`${SITE_METADATA.siteName}.`, {
                fontFamily: "Instrument Serif",
                fontSize: 112,
                fontWeight: 400,
                lineHeight: 1,
                textAlign: "center",
              }),
              {
                type: "div",
                props: {
                  style: {
                    width: 64,
                    height: 1,
                    display: "flex",
                    marginTop: 34,
                    marginBottom: 28,
                    backgroundColor: "rgba(23, 23, 23, 0.24)",
                  },
                },
              },
              textNode(title, {
                maxWidth: 860,
                fontSize: titleFontSize(title, lang),
                fontWeight: 400,
                lineHeight: 1.25,
                textAlign: "center",
              }),
            ],
          },
        },
      ],
    },
  };
}

export async function ogImage({ request }: { request: Request }) {
  const lang = getLangFromRequest(request);
  const parsed = s.parseSafe(
    ogImageQuerySchema,
    new URL(request.url).searchParams,
  );
  if (!parsed.success) return redirect(defaultImageHref(request, lang));

  const requestedTitle = parsed.value.title.trim();
  if (
    parsed.value.title !== "" &&
    !isKnownPageTitle(requestedTitle, lang)
  ) return redirect(defaultImageHref(request, lang));

  const title = displayTitle(requestedTitle, lang);
  const svg = await satori(createCard(lang, title), {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      {
        data: RENDER_FONT_DATA.instrumentSerif,
        name: "Instrument Serif",
        weight: 400,
      },
      {
        data: RENDER_FONT_DATA.notoSerifSc,
        name: "Noto Serif SC",
        weight: 400,
      },
    ],
  });
  const png = new Resvg(svg, {
    font: { loadSystemFonts: false },
  }).render().asPng();
  const body = png.buffer.slice(
    png.byteOffset,
    png.byteOffset + png.byteLength,
  ) as ArrayBuffer;

  return new Response(body, {
    headers: publicCache({
      vary: usesAcceptLanguage(request) ? "Accept-Language" : undefined,
      headers: {
        "Content-Type": "image/png",
      },
    }).headers,
  });
}

function defaultTitle(lang: Lang): string {
  return t("site.tagline", lang);
}

function defaultImageHref(request: Request, lang: Lang): string {
  const url = new URL(request.url);
  url.search = "";
  url.searchParams.set("lang", lang);
  return url.href;
}

function isKnownPageTitle(value: string, lang: Lang): boolean {
  return [
    SITE_METADATA.title[lang],
    t("blog.index.metaTitle", lang),
    t("commentsPage.metaTitle", lang),
    `${t("blog.post.verificationTitle", lang)} | Niapya`,
    `${t("commentsPage.verificationTitle", lang)} | Niapya`,
    ...allPosts.map((article) =>
      `${selectPost(article, lang).post.title} | Niapya`
    ),
  ].includes(value);
}

function displayTitle(value: string, lang: Lang): string {
  const title = value.trim();
  if (!title || title === SITE_METADATA.title[lang]) return defaultTitle(lang);
  return title.replace(/\s*\|\s*Niapya$/i, "");
}

function titleFontSize(title: string, lang: Lang): number {
  const length = Array.from(title).length;
  if (length > 55) return 28;
  if (length > 32) return 32;
  return lang === "zh-cn" ? 38 : 36;
}
