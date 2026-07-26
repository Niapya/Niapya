import { router } from "./app/router.ts";

Deno.serve({}, async (request: Request): Promise<Response> => {
  try {
    return await router.fetch(request);
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
});
