import { Resvg } from "@resvg/resvg-js";
import { maxLength } from "remix/data-schema/checks";
import * as f from "remix/data-schema/form-data";
import * as s from "remix/data-schema";
import satori from "satori";

import { SITE_METADATA } from "@/constants/index.ts";
import { RENDER_FONT_DATA } from "@/data/render-fonts.ts";
import {
  getLangFromRequest,
  type Lang,
  LANGUAGE_CONFIG,
} from "@/i18n/index.ts";

const WIDTH = 1200;
const HEIGHT = 630;

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
  const title = parsed.success
    ? displayTitle(parsed.value.title, lang)
    : defaultTitle(lang);
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
    headers: {
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Content-Type": "image/png",
      Vary: "Accept-Language",
    },
  });
}

function defaultTitle(lang: Lang): string {
  return lang === "zh-cn"
    ? "独立设计师与开发者"
    : "Independent Designer & Developer";
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
