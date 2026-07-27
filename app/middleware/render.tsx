import { renderWith } from "remix/middleware/render";
import { createHtmlResponse } from "remix/response/html";
import type { RemixNode } from "remix/ui";
import { renderToStream } from "remix/ui/server";

import { SITE_METADATA } from "@/constants/index.ts";
import { Document } from "@/components/document.tsx";
import { LangContext } from "./locale.ts";
import { type OpenGraph, OpenGraphContext } from "./open-graph.ts";

type PageMetadata = {
  title?: string;
  description?: string;
  head?: RemixNode;
};

type PageDocument = PageMetadata & {
  kind: "page";
  node: RemixNode;
};

export function page(
  node: RemixNode,
  metadata: PageMetadata = {},
): PageDocument {
  return { kind: "page", node, ...metadata };
}

export function render() {
  return renderWith(
    (context) => {
      const { request } = context;
      const lang = context.get(LangContext);
      const canonicalUrl = new URL(request.url);
      canonicalUrl.search = "";
      canonicalUrl.hash = "";
      const canonical = canonicalUrl.href;
      const openGraph = context.get(OpenGraphContext);
      if (!isOpenGraph(openGraph)) {
        throw new Error("openGraph() must run before render()");
      }

      return function render(
        content: RemixNode | PageDocument,
        init?: ResponseInit,
      ) {
        const pageDocument = isPageDocument(content) ? content : undefined;
        const title = pageDocument?.title ?? SITE_METADATA.title[lang];
        const description = pageDocument?.description ??
          SITE_METADATA.description[lang];
        const socialImage = openGraph.imageUrl({
          lang,
          title,
        });
        const document = (
          <Document
            lang={lang}
            canonical={canonical}
            title={title}
            description={description}
            socialImage={socialImage}
            head={pageDocument?.head}
          >
            {pageDocument?.node ?? content as RemixNode}
          </Document>
        );

        const stream = renderToStream(document, {
          signal: request.signal,
          resolveClientEntry() {
            throw new Error(
              "Client entry resolution is not supported in this environment.",
            );
          },
        });

        return createHtmlResponse(stream, init);
      };
    },
  );
}

function isOpenGraph(value: unknown): value is OpenGraph {
  return typeof value === "object" && value !== null &&
    "imageUrl" in value && typeof value.imageUrl === "function";
}

function isPageDocument(
  value: RemixNode | PageDocument,
): value is PageDocument {
  return typeof value === "object" && value !== null && "kind" in value &&
    value.kind === "page";
}
