import type { Middleware } from "remix/router";

import { IS_DEVELOPMENT } from "@/constants/index.ts";
import { log } from "@/lib/log.ts";

/**
 * Request access logger. Writes one line per request in development:
 * `[main] [time] [INFO] METHOD path status contentLength (duration ms)`.
 * No-op in production.
 */
export function logger(): Middleware {
  return async (context, next) => {
    if (!IS_DEVELOPMENT) return next();

    const start = performance.now();
    const response = await next();
    const duration = Math.round(performance.now() - start);
    const contentLength = response.headers.get("Content-Length") ?? "-";

    log.info(
      `${context.request.method} ${context.url.pathname}${context.url.search} ${response.status} ${contentLength} (${duration} ms)`,
    );

    return response;
  };
}
