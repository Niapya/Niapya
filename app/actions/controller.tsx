import { createController } from "remix/router";

import { manifest } from "@/actions/manifest.ts";
import { ogImage } from "@/actions/og-image.ts";
import { robots } from "@/actions/robots.ts";
import { rss } from "@/actions/rss.tsx";
import { sitemap } from "@/actions/sitemap.tsx";
import { createI18n } from "@/i18n/index.ts";
import { LangContext } from "@/middleware/locale.ts";
import { Home } from "@/pages/home/index.tsx";
import { routes } from "@/routes.ts";

export default createController(routes, {
  actions: {
    ogImage,
    robots,
    rss,
    sitemap,
    manifest,
    home({ get, render }) {
      const i18n = createI18n(get(LangContext));
      return render(<Home i18n={i18n} />);
    },
  },
});
