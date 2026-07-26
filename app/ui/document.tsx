import type { Handle, RemixNode } from "remix/ui";

import { SITE_METADATA } from "../constants.ts";
import { DEFAULT_LANG, type Lang, LANGUAGE_CONFIG } from "../i18n/index.ts";

type DocumentProps = {
  children?: RemixNode;
  head?: RemixNode;
  lang?: Lang;
  canonical?: string;
  title?: string;
  description?: string;
};

export function Document(handle: Handle<DocumentProps>) {
  return () => {
    const {
      children,
      head,
      lang = DEFAULT_LANG,
      canonical = SITE_METADATA.canonicalPath,
      title = SITE_METADATA.title[lang],
      description = SITE_METADATA.description[lang],
    } = handle.props;
    const language = LANGUAGE_CONFIG[lang];
    const keywords = SITE_METADATA.keywords[lang].join(", ");
    const socialImage = canonical.startsWith("http")
      ? new URL(`${SITE_METADATA.ogImage}?lang=${lang}`, canonical).href
      : `${SITE_METADATA.ogImage}?lang=${lang}`;
    const manifest = canonical.startsWith("http")
      ? new URL(`${SITE_METADATA.manifest}?lang=${lang}`, canonical).href
      : `${SITE_METADATA.manifest}?lang=${lang}`;

    return (
      <html lang={language.htmlLang} dir={language.direction}>
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="description" content={description} />
          <meta name="keywords" content={keywords} />
          <meta name="author" content={SITE_METADATA.author} />
          <meta name="robots" content={SITE_METADATA.robots} />
          <meta name="theme-color" content={SITE_METADATA.themeColor} />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wdth,wght@75..100,400..700&family=Instrument+Serif:ital@0;1&family=Noto+Sans+SC:wght@400;500;600;700&family=Noto+Serif+SC:wght@400;500;600;700&display=swap"
          />
          <link rel="icon" type="image/svg+xml" href={SITE_METADATA.favicon} />
          <link rel="manifest" href={manifest} />
          <link rel="canonical" href={canonical} />
          <meta property="og:type" content={SITE_METADATA.openGraph.type} />
          <meta property="og:site_name" content={SITE_METADATA.siteName} />
          <meta property="og:title" content={title} />
          <meta property="og:description" content={description} />
          <meta property="og:url" content={canonical} />
          <meta property="og:locale" content={language.ogLocale} />
          <meta property="og:image" content={socialImage} />
          <meta property="og:image:alt" content={title} />
          <meta name="twitter:card" content={SITE_METADATA.twitter.card} />
          <meta name="twitter:title" content={title} />
          <meta name="twitter:description" content={description} />
          <meta name="twitter:image" content={socialImage} />
          <title>{title}</title>
          {head}
        </head>
        <body class="bg-background text-foreground font-sans antialiased">
          {children}
        </body>
      </html>
    );
  };
}
