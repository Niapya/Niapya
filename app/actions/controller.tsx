import { createController } from "remix/router";

import { manifest } from "./metadata/manifest.ts";
import { ogImage } from "./metadata/og-image.ts";
import { robots } from "./metadata/robots.ts";
import { sitemap } from "./metadata/sitemap.ts";
import { t } from "../i18n/index.ts";
import { routes } from "../routes.ts";

export const controller = createController(routes, {
  actions: {
    ogImage,
    robots,
    sitemap,
    manifest,
    home({ render, lang }) {
      return render(
        <main>
          <h1>Niapya</h1>
          <p>{t("hero.tagline", lang)}</p>
        </main>,
      );
    },
  },
});
