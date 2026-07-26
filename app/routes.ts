import { route } from "remix/routes";

export const routes = route({
  home: "/",
  ogImage: "/og-image.png",
  robots: "/robots.txt",
  sitemap: "/sitemap.xml",
  manifest: "/manifest.webmanifest",
});
