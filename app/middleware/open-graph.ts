import { createContextKey, type Middleware } from "remix/router";

import { SITE_METADATA } from "@/constants/index.ts";
import type { Lang } from "@/i18n/index.ts";

export type OpenGraph = {
  imageUrl(options: { lang: Lang; title: string }): string;
};

export const OpenGraphContext = createContextKey<OpenGraph>();

export function openGraph(): Middleware<{
  key: typeof OpenGraphContext;
  value: OpenGraph;
  property: "openGraph";
}> {
  return (context, next) => {
    context.set(OpenGraphContext, {
      imageUrl({ lang, title }) {
        const imageUrl = new URL(SITE_METADATA.ogImage, context.request.url);
        imageUrl.searchParams.set("lang", lang);
        imageUrl.searchParams.set("title", title);
        return imageUrl.href;
      },
    }, { property: "openGraph" });

    return next();
  };
}
