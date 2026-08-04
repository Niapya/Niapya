import { allPosts } from "@/data/posts.ts";
import { cachePolicies } from "@/lib/cache.ts";
import { routes } from "@/routes.ts";
import { buildXml } from "@/utils/jsx-xml.ts";

const { public: publicCache } = cachePolicies;

type SitemapEntry = {
  href: string;
  changeFrequency: string;
  priority: string;
  lastModified?: string;
};

export function sitemap({ request }: { request: Request }) {
  const origin = new URL(request.url).origin;
  const entries: SitemapEntry[] = [
    {
      href: routes.home.href(),
      changeFrequency: "monthly",
      priority: "1.0",
    },
    {
      href: routes.blog.index.href(),
      changeFrequency: "weekly",
      priority: "0.8",
    },
    ...allPosts.map((post) => ({
      href: routes.blog.article.href({ slug: post.slug }),
      changeFrequency: "monthly",
      priority: "0.7",
      lastModified: post.updatedAt,
    })),
  ];
  const xml = buildXml(
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      {entries.map((entry) => (
        <url>
          <loc>{new URL(entry.href, origin).href}</loc>
          {entry.lastModified && <lastmod>{entry.lastModified}</lastmod>}
          <changefreq>{entry.changeFrequency}</changefreq>
          <priority>{entry.priority}</priority>
        </url>
      ))}
    </urlset>,
  );

  return new Response(xml, {
    headers: publicCache({
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    }).headers,
  });
}
