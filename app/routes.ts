import { get, post, route } from "remix/routes";

export const routes = route({
  home: "/",
  comments: {
    index: get("/comments"),
    verify: post("/comments"),
    publish: post("/comments/verify"),
  },
  blog: route("/blog", {
    index: get("/"),
    article: get("/:slug"),
    comment: post("/:slug/comments"),
    publishComment: post("/:slug/comments/verify"),
  }),
  ogImage: "/og-image.png",
  robots: "/robots.txt",
  sitemap: "/sitemap.xml",
  rss: "/rss.xml",
  manifest: "/manifest.webmanifest",
});
