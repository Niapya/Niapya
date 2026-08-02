import { router } from "@/router.ts";

Deno.serve(
  (request: Request): Promise<Response> => {
    return router.fetch(request);
  },
);
