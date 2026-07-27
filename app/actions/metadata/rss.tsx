// RSS uses <link> as a container, unlike the void element with the same HTML tag name.
// deno-lint-ignore-file jsx-void-dom-elements-no-children

import { SITE_METADATA } from "@/constants/index.ts";
import {
  getLangFromRequest,
  LANGUAGE_CONFIG,
  localizeHref,
} from "@/i18n/index.ts";
import { allPosts } from "@/posts/index.ts";
import { routes } from "@/routes.ts";
import { buildXml } from "@/utils/jsx-xml.ts";
import { renderMarkdown } from "@/utils/markdown.ts";

export function rss({ request }: { request: Request }) {
  const origin = new URL(request.url).origin;
  const lang = getLangFromRequest(request);
  const blogUrl = new URL(
    localizeHref(routes.blog.index.href(), lang),
    origin,
  ).href;
  const latestPost = allPosts[0];
  const xml = buildXml(
    <rss version="2.0">
      <channel>
        <title>{`${SITE_METADATA.siteName} Blog`}</title>
        <link>{blogUrl}</link>
        <description>{SITE_METADATA.description[lang]}</description>
        <language>{LANGUAGE_CONFIG[lang].htmlLang}</language>
        {latestPost && (
          <lastBuildDate>
            {new Date(latestPost.updatedAt).toUTCString()}
          </lastBuildDate>
        )}
        {allPosts.map((post) => {
          const articleUrl = new URL(
            localizeHref(routes.blog.article.href({ slug: post.slug }), lang),
            origin,
          ).href;

          return (
            <item>
              <title>{post.title}</title>
              <link>{articleUrl}</link>
              <guid isPermaLink>{articleUrl}</guid>
              <pubDate>{new Date(post.createdAt).toUTCString()}</pubDate>
              <description>{renderMarkdown(post.content)}</description>
            </item>
          );
        })}
      </channel>
    </rss>,
  );

  return new Response(xml, {
    headers: {
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
