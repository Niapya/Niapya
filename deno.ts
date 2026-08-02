import { handleRequest } from "@/lib/log.ts";
import { router } from "@/router.ts";

Deno.serve(
  {/* default 8000 */},
  (request: Request): Promise<Response> => handleRequest(request, router.fetch),
);
