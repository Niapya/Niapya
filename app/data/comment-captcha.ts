import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import type { Lang } from "@/i18n/index.ts";
import { RENDER_FONT_DATA } from "@/lib/render-fonts.ts";

export const COMMENT_CAPTCHA_WIDTH = 280;
export const COMMENT_CAPTCHA_HEIGHT = 188;

const BOARD_TOP = 68;
const COLUMNS = 4;
const ROWS = 2;
const CELL_WIDTH = COMMENT_CAPTCHA_WIDTH / COLUMNS;
const CELL_HEIGHT = (COMMENT_CAPTCHA_HEIGHT - BOARD_TOP) / ROWS;
const HIT_RADIUS = 20;

const COLORS = ["#e85d4a", "#147d78", "#e5b83a", "#242424"] as const;
const SHAPES = ["circle", "square", "diamond", "ring"] as const;

type CaptchaShape = typeof SHAPES[number];

type CaptchaGlyph = {
  color: typeof COLORS[number];
  shape: CaptchaShape;
};

export type CommentCaptchaTarget = {
  x: number;
  y: number;
  radius: number;
};

export type CommentCaptchaChallenge = {
  token: string;
  image: string;
  width: number;
  height: number;
};

export type CommentCaptchaAnswer = {
  token: string;
  x: number;
  y: number;
};

export type GeneratedCommentCaptcha = {
  image: string;
  target: CommentCaptchaTarget;
};

export async function generateCommentCaptcha(
  expiresAt: number,
  lang: Lang,
): Promise<GeneratedCommentCaptcha> {
  const glyphs = createGlyphs();
  const targetIndex = randomInteger(0, COLUMNS * ROWS - 1);
  const targetGlyph = glyphs[targetIndex];
  const column = targetIndex % COLUMNS;
  const row = Math.floor(targetIndex / COLUMNS);
  const target = {
    x: column * CELL_WIDTH + CELL_WIDTH / 2,
    y: BOARD_TOP + row * CELL_HEIGHT + CELL_HEIGHT / 2,
    radius: HIT_RADIUS,
  };

  const svg = await satori(
    createCaptchaCard(targetGlyph, glyphs, expiresAt, lang) as never,
    {
      width: COMMENT_CAPTCHA_WIDTH,
      height: COMMENT_CAPTCHA_HEIGHT,
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
    },
  );
  const png = new Resvg(svg, {
    font: { loadSystemFonts: false },
  }).render().asPng();

  return {
    image: `data:image/png;base64,${png.toBase64()}`,
    target,
  };
}

export function matchesCommentCaptcha(
  answer: Pick<CommentCaptchaAnswer, "x" | "y">,
  target: CommentCaptchaTarget,
): boolean {
  const deltaX = answer.x - target.x;
  const deltaY = answer.y - target.y;
  return deltaX * deltaX + deltaY * deltaY <= target.radius * target.radius;
}

function createGlyphs(): CaptchaGlyph[] {
  const combinations = SHAPES.flatMap((shape) =>
    COLORS.map((color) => ({ shape, color }))
  );
  shuffle(combinations);
  return combinations.slice(0, COLUMNS * ROWS);
}

export function groupCaptchaRows<T>(values: readonly T[]): T[][] {
  const rows: T[][] = [];
  for (let index = 0; index < values.length; index += COLUMNS) {
    rows.push(values.slice(index, index + COLUMNS));
  }
  return rows;
}

function createCaptchaCard(
  sample: CaptchaGlyph,
  glyphs: CaptchaGlyph[],
  expiresAt: number,
  lang: Lang,
) {
  const fontFamily = lang === "zh-cn" ? "Noto Serif SC" : "Instrument Serif";
  const instruction = lang === "zh-cn"
    ? "匹配顶部样本，点击下方图形"
    : "MATCH THE SAMPLE, THEN CLICK BELOW";
  const expiry = lang === "zh-cn"
    ? `有效至 ${formatExpiry(expiresAt)}`
    : `EXPIRES ${formatExpiry(expiresAt)}`;

  return {
    type: "div",
    props: {
      style: {
        width: COMMENT_CAPTCHA_WIDTH,
        height: COMMENT_CAPTCHA_HEIGHT,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#f7f5ef",
        border: "2px solid #242424",
        overflow: "hidden",
        fontFamily,
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              height: BOARD_TOP,
              display: "flex",
              alignItems: "center",
              padding: "10px 12px",
              gap: 12,
              backgroundColor: "#ffffff",
              borderBottom: "2px dashed #9a958b",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    width: 44,
                    height: 44,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid #d3cec3",
                    backgroundColor: "#f7f5ef",
                  },
                  children: createShapeNode(sample, 26),
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: 4,
                  },
                  children: [
                    textNode(instruction, {
                      color: "#242424",
                      fontSize: lang === "zh-cn" ? 11 : 10,
                      fontWeight: 400,
                      lineHeight: 1.2,
                    }),
                    textNode(expiry, {
                      color: "#6f6a61",
                      fontSize: 9,
                      fontWeight: 400,
                      lineHeight: 1.2,
                    }),
                  ],
                },
              },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: {
              height: COMMENT_CAPTCHA_HEIGHT - BOARD_TOP,
              display: "flex",
              flexDirection: "column",
            },
            children: groupCaptchaRows(glyphs).map((row, rowIndex) => ({
              type: "div",
              props: {
                style: {
                  height: CELL_HEIGHT,
                  display: "flex",
                },
                children: row.map((glyph, columnIndex) => ({
                  type: "div",
                  props: {
                    style: {
                      width: CELL_WIDTH,
                      height: CELL_HEIGHT,
                      boxSizing: "border-box",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor:
                        (rowIndex * COLUMNS + columnIndex) % 2 ===
                            0
                          ? "#f7f5ef"
                          : "#efede6",
                      borderRight: columnIndex === COLUMNS - 1
                        ? "0"
                        : "1px solid #ded9cf",
                      borderBottom: rowIndex === ROWS - 1
                        ? "0"
                        : "1px solid #ded9cf",
                    },
                    children: createShapeNode(glyph, 28),
                  },
                })),
              },
            })),
          },
        },
      ],
    },
  };
}

function textNode(text: string, style: Record<string, string | number>) {
  return {
    type: "div",
    props: { style, children: text },
  };
}

function formatExpiry(value: number): string {
  const date = new Date(value);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute} UTC`;
}

function createShapeNode(glyph: CaptchaGlyph, size: number) {
  const isRing = glyph.shape === "ring";
  return {
    type: "div",
    props: {
      style: {
        width: size,
        height: size,
        display: "flex",
        backgroundColor: isRing ? "transparent" : glyph.color,
        border: isRing ? `7px solid ${glyph.color}` : "0",
        borderRadius: glyph.shape === "circle" || glyph.shape === "ring"
          ? "999px"
          : "3px",
        ...(glyph.shape === "diamond" ? { transform: "rotate(45deg)" } : {}),
      },
    },
  };
}

function shuffle<T>(values: T[]): void {
  for (let index = values.length - 1; index > 0; index--) {
    const swapIndex = randomInteger(0, index);
    [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
  }
}

function randomInteger(minimum: number, maximum: number): number {
  const range = maximum - minimum + 1;
  const value = crypto.getRandomValues(new Uint32Array(1))[0];
  return minimum + value % range;
}
