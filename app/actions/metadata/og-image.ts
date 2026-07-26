import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import notoSansScBytes from "./fonts/og/NotoSansCJKsc-Regular.otf" with {
  type: "bytes",
};
import robotoBoldBytes from "./fonts/og/Roboto-Bold.ttf" with { type: "bytes" };
import robotoRegularBytes from "./fonts/og/Roboto-Regular.ttf" with {
  type: "bytes",
};

import { SITE_METADATA } from "../../constants.ts";
import {
  getLangFromRequest,
  type Lang,
  LANGUAGE_CONFIG,
} from "../../i18n/index.ts";

const WIDTH = 1200;
const HEIGHT = 630;

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

const fonts = {
  roboto: {
    regular: toArrayBuffer(robotoRegularBytes),
    bold: toArrayBuffer(robotoBoldBytes),
  },
  notoSansSc: toArrayBuffer(notoSansScBytes),
};

function textNode(text: string, style: Record<string, string | number>) {
  return {
    type: "div",
    props: { style, children: text },
  };
}

function createCard(lang: Lang) {
  const language = LANGUAGE_CONFIG[lang];
  const fontFamily = lang === "zh-cn" ? "Noto Sans CJK SC" : "Roboto";
  const title = SITE_METADATA.title[lang];
  const description = SITE_METADATA.description[lang];
  const footer = lang === "zh-cn"
    ? "用心构建数字产品、界面与实验。"
    : "Thoughtful digital products, interfaces, and experiments.";

  return {
    type: "div",
    props: {
      lang: language.htmlLang,
      style: {
        width: WIDTH,
        height: HEIGHT,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        backgroundColor: SITE_METADATA.themeColor,
        color: "#171717",
        fontFamily,
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            },
            children: [
              textNode(SITE_METADATA.siteName, {
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: 1,
              }),
              textNode("PORTFOLIO / 2026", {
                fontSize: 18,
                fontWeight: 400,
                letterSpacing: 2,
                color: "#6b665d",
              }),
            ],
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: 24,
              maxWidth: 980,
            },
            children: [
              textNode(title, {
                fontSize: 66,
                fontWeight: 700,
                lineHeight: 1.08,
              }),
              textNode(description, {
                fontSize: 28,
                fontWeight: 400,
                lineHeight: 1.35,
                color: "#5c574f",
              }),
            ],
          },
        },
        textNode(footer, {
          fontSize: 18,
          fontWeight: 400,
          color: "#6b665d",
        }),
      ],
    },
  };
}

export async function ogImage({ request }: { request: Request }) {
  const lang = getLangFromRequest(request);
  const svg = await satori(createCard(lang) as never, {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      { data: fonts.roboto.regular, name: "Roboto", weight: 400 },
      { data: fonts.roboto.bold, name: "Roboto", weight: 700 },
      { data: fonts.notoSansSc, name: "Noto Sans CJK SC", weight: 400 },
      { data: fonts.notoSansSc, name: "Noto Sans CJK SC", weight: 700 },
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
