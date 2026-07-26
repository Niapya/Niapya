import { createContextKey, type Middleware } from "remix/router";

import { DEFAULT_LANG, getLangFromRequest, type Lang } from "../i18n/index.ts";

export const LangContext = createContextKey<Lang>(DEFAULT_LANG);

export function locale(): Middleware<{
  key: typeof LangContext;
  value: Lang;
  property: "lang";
}> {
  return (context, next) => {
    context.set(LangContext, getLangFromRequest(context.request), {
      property: "lang",
    });
    return next();
  };
}
