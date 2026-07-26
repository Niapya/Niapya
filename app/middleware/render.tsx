import { renderWith } from "remix/middleware/render";
import { createHtmlResponse } from "remix/response/html";
import type { RemixNode } from "remix/ui";
import { renderToStream } from "remix/ui/server";

export function render() {
  return renderWith(
    ({ request }) =>
      function render(node: RemixNode, init?: ResponseInit) {
        const stream = renderToStream(node, {
          signal: request.signal,
          resolveClientEntry() {
            throw new Error("Client entry resolution is not supported in this environment.");
          },
        });

        return createHtmlResponse(stream, init);
      },
  );
}
