import { form, get, post, route } from "remix/routes";

export const routes = route({
  home: "/",
  comments: form("/comments"),
  blog: route("/blog", {
    index: get("/"),
    article: get("/:slug"),
    comment: post("/:slug/comments"),
  }),
  ogImage: "/og-image.png",
  robots: "/robots.txt",
  sitemap: "/sitemap.xml",
  rss: "/rss.xml",
  manifest: "/manifest.webmanifest",
});
