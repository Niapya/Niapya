import { log } from "@/lib/log.ts";
import { router } from "@/router.ts";

async function handleRequest(request: Request): Promise<Response> {
  try {
    return await router.fetch(request);
  } catch (error) {
    log.error("Unhandled request error", {
      method: request.method,
      pathname: new URL(request.url).pathname,
      error: error instanceof Error ? error : String(error),
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}

Deno.serve(handleRequest);
