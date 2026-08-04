import { staticFiles } from "remix/middleware/static";
import { createRouter, type RouterContext } from "remix/router";

import rootController from "@/actions/controller.tsx";
import { render } from "@/actions/render.tsx";
import blogController from "@/actions/blog/controller.tsx";
import commentsController from "@/actions/comments/controller.tsx";
import { cachePolicies } from "@/lib/cache.ts";
import { locale } from "@/middleware/locale.ts";
import { openGraph } from "@/middleware/open-graph.ts";
import { twind } from "@/middleware/twind.ts";
import { routes } from "@/routes.ts";

const { static: staticCache } = cachePolicies;

export const router = createRouter({
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

export type AppContext = RouterContext<typeof router>;

declare module "remix/router" {
  interface RouterTypes {
    context: AppContext;
  }
}

router.map(routes, rootController);
router.map(routes.blog, blogController);
router.map(routes.comments, commentsController);
