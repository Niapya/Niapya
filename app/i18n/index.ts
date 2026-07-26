import en from "./lang/en.ts";
import zhCn from "./lang/zh-cn.ts";

export const SUPPORTED_LANGS = ["en", "zh-cn"] as const;
export type Lang = typeof SUPPORTED_LANGS[number];

export const DEFAULT_LANG: Lang = "en";

export const LANGUAGE_CONFIG = {
  en: {
    htmlLang: "en",
    locale: "en-US",
    ogLocale: "en_US",
    label: "English",
    nativeLabel: "English",
    direction: "ltr",
  },
  "zh-cn": {
    htmlLang: "zh-CN",
    locale: "zh-CN",
    ogLocale: "zh_CN",
    label: "Chinese (Simplified)",
    nativeLabel: "简体中文",
    direction: "ltr",
  },
} as const;

const messages = {
  en,
  "zh-cn": zhCn,
} as const;

type DotKeys<T> = T extends object ? {
    [K in Extract<keyof T, string>]: T[K] extends object
      ? `${K}.${DotKeys<T[K]>}`
      : K;
  }[Extract<keyof T, string>]
  : never;

export type MessageKey = DotKeys<typeof en>;

function get(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (
      current === null || current === undefined || typeof current !== "object"
    ) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : undefined;
}

export function t(key: MessageKey, lang: Lang = DEFAULT_LANG): string {
  return get(messages[lang] as Record<string, unknown>, key) ??
    get(messages[DEFAULT_LANG] as Record<string, unknown>, key) ?? key;
}

export function parseLang(value: string | null): Lang | undefined {
  if (!value) return undefined;

  const normalized = value.trim().toLowerCase().replaceAll("_", "-");
  if (normalized === "en" || normalized.startsWith("en-")) return "en";
  if (
    normalized === "zh" ||
    normalized === "zh-cn" ||
    normalized === "zh-hans" ||
    normalized === "zh-sg" ||
    normalized.startsWith("zh-hans-")
  ) return "zh-cn";
  return undefined;
}

export function getLangFromRequest(request: Request): Lang {
  const urlLang = parseLang(new URL(request.url).searchParams.get("lang"));
  if (urlLang) return urlLang;

  const header = request.headers.get("Accept-Language");
  if (!header) return DEFAULT_LANG;

  const candidates = header.split(",").map((item, index) => {
    const [rawTag, ...parameters] = item.trim().split(";");
    const quality = parameters.find((parameter) =>
      parameter.trim().startsWith("q=")
    );
    const weight = quality ? Number(quality.trim().slice(2)) : 1;
    return { index, tag: rawTag, weight: Number.isNaN(weight) ? 0 : weight };
  }).sort((left, right) =>
    right.weight - left.weight || left.index - right.index
  );

  for (const candidate of candidates) {
    const lang = parseLang(candidate.tag);
    if (lang) return lang;
  }

  return DEFAULT_LANG;
}

export function createI18n(lang: Lang) {
  return {
    lang,
    config: LANGUAGE_CONFIG[lang],
    t: (key: MessageKey) => t(key, lang),
  };
}

export type I18n = ReturnType<typeof createI18n>;
