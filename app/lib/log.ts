import {
  configure,
  getConsoleSink,
  getLogger,
  type Logger,
} from "@logtape/logtape";

const isDevelopment = Deno.env.get("NODE_ENV") === "development";

await configure({
  sinks: {
    console: getConsoleSink(),
  },
  loggers: [
    {
      category: ["niapya"],
      lowestLevel: isDevelopment ? "info" : "warning",
      sinks: ["console"],
    },
    {
      category: ["logtape", "meta"],
      lowestLevel: "warning",
      sinks: ["console"],
    },
  ],
});

const requestLogger = getLogger(["niapya", "request"]);

function logResponse(logger: Logger, response: Response, startedAt: number) {
  const properties = {
    status: response.status,
    durationMs: Math.round(performance.now() - startedAt),
  };
  const message =
    "Completed {method} {path} with status {status} in {durationMs} ms.";

  if (response.status >= 500) {
    logger.error(message, properties);
  } else if (response.status >= 400) {
    logger.warn(message, properties);
  } else {
    logger.info(message, properties);
  }
}

/** Runs a request handler with structured request and error logging. */
export async function handleRequest(
  request: Request,
  handler: (request: Request) => Response | Promise<Response>,
): Promise<Response> {
  const startedAt = performance.now();
  const logger = requestLogger.with({
    method: request.method,
    path: new URL(request.url).pathname,
  });

  logger.info("Started {method} {path}.");

  try {
    const response = await handler(request);
    logResponse(logger, response, startedAt);
    return response;
  } catch (error) {
    logger.error(
      "Unhandled error while processing {method} {path} after {durationMs} ms: {error}",
      {
        durationMs: Math.round(performance.now() - startedAt),
        error,
      },
    );
    return new Response("Internal Server Error", { status: 500 });
  }
}
