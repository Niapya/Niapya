import { renderWith } from "remix/middleware/render";
import { createHtmlResponse } from "remix/response/html";
import type { RemixNode } from "remix/ui";
import { renderToStream } from "remix/ui/server";

import { SITE_METADATA } from "../constants.ts";
import { Document } from "../ui/document.tsx";
import { LangContext } from "./locale.ts";

export function render() {
  return renderWith(
    (context) => {
      const { request } = context;
      const lang = context.get(LangContext);
      const canonical = new URL(SITE_METADATA.canonicalPath, request.url).href;

      return function render(node: RemixNode, init?: ResponseInit) {
        const document = (
          <Document lang={lang} canonical={canonical}>
            {node}
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
