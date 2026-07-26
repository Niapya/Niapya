import { staticFiles } from "remix/middleware/static";
import { createRouter, type MiddlewareContext } from "remix/router";

import controller from "./actions/controller.tsx";
import { render } from "./middleware/render.tsx";
import { twind } from "./middleware/twind.ts";
import { routes } from "./routes.ts";

type AppContext = MiddlewareContext<[ReturnType<typeof render>]>;

declare module "remix/router" {
  interface RouterTypes {
    context: AppContext;
  }
}

export const router = createRouter<AppContext>({
  middleware: [
    staticFiles("./public", { index: false }),
    twind(),
    render(),
  ],
});

router.map(routes, controller);
