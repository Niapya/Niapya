import { routes } from "@/routes.ts";

export const SITE_NAVIGATION = [
  {
    id: "home",
    href: routes.home.href(),
  },
  {
    id: "blog",
    href: routes.blog.index.href(),
  },
  {
    id: "comments",
    href: routes.comments.index.href(),
  },
] as const;

export type SiteNavigationId = (typeof SITE_NAVIGATION)[number]["id"];
