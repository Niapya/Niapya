import { IS_PRODUCTION } from "@/constants/index.ts";
import {
  consume,
  identity,
  type InlineOptions,
  install,
  noop,
  stringify,
  tw as managedTw,
} from "@twind/core";
import diff from "fast-diff";
import type { Middleware } from "remix/router";
import twindConfig from "@/config/twind.config.ts";

export const tw = install(twindConfig, IS_PRODUCTION);

const encoder = new TextEncoder();

export function twind(): Middleware {
  return async ({ request }, next) => {
    const response = await next();

    if (!response.body || !isHtml(response.headers.get("Content-Type"))) {
      return response;
    }

    const headers = new Headers(response.headers);
    headers.delete("Content-Length");

    return new Response(
      response.body.pipeThrough(new TwindStream(), {
        signal: request.signal,
      }),
      {
        status: response.status,
        statusText: response.statusText,
        headers,
      },
    );
  };
}

class TwindStream extends TransformStream<Uint8Array, Uint8Array> {
  constructor(options?: InlineOptions["tw"] | InlineOptions) {
    const state = createState(options);
    const decoder = new TextDecoder();

    const flushState: TransformerFlushCallback<Uint8Array> = (controller) => {
      const markup = state.flush();
      if (markup) controller.enqueue(encoder.encode(markup));
    };

    super({
      transform(chunk, controller) {
        if (state.push(decoder.decode(chunk, { stream: true }))) {
          flushState(controller);
        }
      },
      flush(controller) {
        const trailing = decoder.decode();
        if (trailing) state.push(trailing);
        flushState(controller);
      },
    });
  }
}

function createState(options: InlineOptions["tw"] | InlineOptions = {}) {
  const { tw = managedTw, minify = identity } = typeof options === "function"
    ? { tw: options }
    : options;

  let buffer = "";
  let lastStyle: string | null = null;
  let restoreCurrentState = noop;

  return {
    push(chunk: string): boolean {
      buffer += chunk;
      return lastStyle === null ? isShellReady(buffer) : isChunkReady(buffer);
    },

    flush(): string | undefined {
      if (!buffer) return;

      const restoreGlobalState = tw.snapshot();
      restoreCurrentState();

      let html = consume(buffer, tw);
      const nextStyle = minify(stringify(tw.target), html);

      restoreCurrentState = tw.snapshot();
      restoreGlobalState();

      if (lastStyle === null) {
        html = html.replace(
          "</head>",
          `<style data-twind>${nextStyle}</style></head>`,
        );
      } else {
        const styleDiff = getStyleDiff(lastStyle, nextStyle);
        if (styleDiff.length) html = createStylePatch(styleDiff) + html;
      }

      buffer = "";
      lastStyle = nextStyle;
      return html;
    },
  };
}

function getStyleDiff(previous: string, next: string): [number, string][] {
  const changes: [number, string][] = [];
  let offset = 0;

  for (const [type, text] of diff(previous, next)) {
    if (type === 1) changes.push([offset, text]);
    offset += text.length;
  }

  return changes;
}

function createStylePatch(changes: [number, string][]): string {
  return `<script>!function(e,n){e&&(e.textContent=n.reduce((function(e,n){return e.slice(0,n[0])+n[1]+e.slice(n[0])}),e.textContent||''))}(document.querySelector('style[data-twind=""]'),${
    JSON.stringify(changes)
  })</script>`;
}

function isShellReady(markup: string): boolean {
  return hasFlushMarker(markup) ||
    /<\/body>\s*<\/html>\s*$/i.test(markup);
}

function isChunkReady(markup: string): boolean {
  return hasFlushMarker(markup) || /<\/template>\s*$/i.test(markup);
}

function hasFlushMarker(markup: string): boolean {
  return /<!--\s*rmx:flush\s+(?:document|fragment)\s*-->\s*$/.test(markup);
}

function isHtml(contentType: string | null): boolean {
  return contentType?.split(";", 1)[0].trim().toLowerCase() === "text/html";
}
