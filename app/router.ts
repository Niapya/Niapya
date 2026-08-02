import { staticFiles } from "remix/middleware/static";
import { createRouter, type MiddlewareContext } from "remix/router";

import controller from "@/actions/index.tsx";
import blogController from "@/actions/blog/index.tsx";
import commentsController from "@/actions/comments/index.tsx";
import { cachePolicies } from "@/lib/cache.ts";
import { locale } from "@/middleware/locale.ts";
import { openGraph } from "@/middleware/open-graph.ts";
import { render } from "@/middleware/render.tsx";
import { twind } from "@/middleware/twind.ts";
import { routes } from "@/routes.ts";

const { static: staticCache } = cachePolicies;

type AppContext = MiddlewareContext<[
  ReturnType<typeof locale>,
  ReturnType<typeof openGraph>,
  ReturnType<typeof render>,
]>;

declare module "remix/router" {
  interface RouterTypes {
    context: AppContext;
  }
}

export const router = createRouter<AppContext>({
  middleware: [
    staticFiles("./public", {
      index: false,
      cacheControl: staticCache().cacheControl,
    }),
    locale(),
    openGraph(),
    twind(),
    render(),
  ],
});

router.map(routes, controller);
router.map(routes.blog, blogController);
router.map(routes.comments, commentsController);
