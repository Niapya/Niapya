import en from "./lang/en.ts";
import zhCn from "./lang/zh-cn.ts";

export type Lang = "en" | "zh-cn";

export const DEFAULT_LANG: Lang = "en";

export type Messages = typeof en;

const messages: Record<Lang, Messages> = {
  en,
  "zh-cn": zhCn,
};

type DotPrefix<T extends string, K extends string> = K extends never ? T : `${T}.${K}`;
type DotKeys<T, P extends string = ""> = T extends object
  ? { [K in Extract<keyof T, string>]: DotPrefix<K, DotKeys<T[K], K>> }[Extract<keyof T, string>]
  : P;

export type MessageKey = DotKeys<Messages>;

function get(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : undefined;
}

export function t(key: MessageKey, lang: Lang = DEFAULT_LANG): string {
  return get(messages[lang] as Record<string, unknown>, key) ?? get(messages[DEFAULT_LANG] as Record<string, unknown>, key) ?? key;
}

export function getLangFromRequest(request: Request): Lang {
  const header = request.headers.get("Accept-Language");
  if (!header) return DEFAULT_LANG;

  const preferred = header
    .split(",")
    .map((item) => item.trim().split(";")[0].toLowerCase())
    .find((code): code is Lang => code in messages);

  return preferred ?? DEFAULT_LANG;
}

export function createI18n(lang: Lang) {
  return {
    lang,
    t: (key: MessageKey) => t(key, lang),
  };
}

export type I18n = ReturnType<typeof createI18n>;
