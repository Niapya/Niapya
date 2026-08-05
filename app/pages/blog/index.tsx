import { css, cx } from "@twind/core";
import type { Handle } from "remix/ui";

import { type I18n, type Lang, localizeHref } from "@/i18n/index.ts";
import type { Post } from "@/data/posts.ts";
import { routes } from "@/routes.ts";
import { Header } from "@/components/header.tsx";
import { Icon } from "@/components/icon.tsx";
import { blogPostTitleTransitionName } from "./view-transition.ts";

type BlogIndexPageProps = {
  i18n: I18n;
  posts: readonly Post[];
  page: number;
  totalPages: number;
  totalPosts: number;
};

const blogHeadingTransitionStyle = css({
  viewTransitionName: "blog-index-title",
});

export function BlogIndexPage(handle: Handle<BlogIndexPageProps>) {
  return () => {
    const props = handle.props;
    const lang = props.i18n.lang;
    const copy = props.i18n.messages.blog.index;

    return (
      <div class="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
        <Header current="blog" i18n={props.i18n} />

        <main>
          <section class="border-b border-border">
            <div class="mx-auto grid max-w-8xl gap-10 px-5 pt-16 pb-16 sm:px-10 sm:pt-20 sm:pb-20 lg:grid-cols-12 lg:px-20 lg:pt-24">
              <div class="lg:col-span-8">
                <p class="mb-5 font-mono text-primary text-xs uppercase">
                  {copy.eyebrow}
                </p>
                <h1
                  class={cx(
                    "max-w-4xl font-display font-normal text-5xl leading-none sm:text-7xl lg:text-8xl",
                    blogHeadingTransitionStyle,
                  )}
                >
                  {copy.title}
                </h1>
              </div>
              <div class="flex flex-col justify-end lg:col-span-4 lg:pb-2">
                <p class="max-w-xl text-base text-muted-foreground leading-7 sm:text-lg">
                  {copy.introduction}
                </p>
                <p class="mt-6 font-mono text-xs uppercase">
                  {copy.count(props.totalPosts)}
                </p>
              </div>
            </div>
          </section>

          <div class="mx-auto max-w-8xl px-5 sm:px-10 lg:px-20">
            {props.posts.length === 0
              ? (
                <p class="border-b border-border py-20 font-display text-3xl text-muted-foreground">
                  {copy.empty}
                </p>
              )
              : (
                <ol class="m-0 list-none p-0">
                  {props.posts.map((post, index) => (
                    <li key={post.slug} class="border-b border-border">
                      <article class="group grid gap-6 py-10 sm:py-12 lg:grid-cols-12 lg:gap-10">
                        <div class="lg:col-span-2">
                          <p class="font-mono text-muted-foreground text-xs uppercase">
                            {String((props.page - 1) * 6 + index + 1).padStart(
                              2,
                              "0",
                            )}
                          </p>
                          <time
                            dateTime={post.updatedAt}
                            class="mt-2 block font-mono text-muted-foreground text-xs"
                          >
                            {copy.updated} {formatDate(post.updatedAt, lang)}
                          </time>
                        </div>
                        <div class="lg:col-span-8">
                          <h2
                            class="font-display font-normal text-3xl leading-tight sm:text-4xl"
                            style={{
                              viewTransitionName: blogPostTitleTransitionName(
                                post.slug,
                              ),
                            }}
                          >
                            <a
                              href={localizeHref(
                                routes.blog.article.href({ slug: post.slug }),
                                lang,
                              )}
                              class="cursor-pointer select-none outline-none transition-colors hover:text-primary focus-visible:text-primary"
                            >
                              {post.title}
                            </a>
                          </h2>
                        </div>
                        <div class="flex items-end justify-end lg:col-span-2">
                          <a
                            href={localizeHref(
                              routes.blog.article.href({ slug: post.slug }),
                              lang,
                            )}
                            class="inline-flex min-h-10 cursor-pointer select-none items-center gap-2 font-semibold text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring group-hover:text-primary"
                          >
                            {copy.read}
                            <Icon
                              name="lucide:arrow-right"
                              className="h-4 w-4"
                            />
                          </a>
                        </div>
                      </article>
                    </li>
                  ))}
                </ol>
              )}

            <nav
              aria-label={copy.pagination}
              class="flex items-center justify-between gap-5 py-10"
            >
              {props.page > 1
                ? (
                  <a
                    href={blogHref({
                      page: props.page - 1,
                    }, lang)}
                    class="inline-flex min-h-10 cursor-pointer select-none items-center gap-2 font-semibold text-sm outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Icon name="lucide:arrow-left" className="h-4 w-4" />
                    {copy.previous}
                  </a>
                )
                : <span />}
              <span class="select-none font-mono text-muted-foreground text-xs uppercase">
                {copy.page(props.page, props.totalPages)}
              </span>
              {props.page < props.totalPages
                ? (
                  <a
                    href={blogHref({
                      page: props.page + 1,
                    }, lang)}
                    class="inline-flex min-h-10 cursor-pointer select-none items-center gap-2 font-semibold text-sm outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {copy.next}
                    <Icon name="lucide:arrow-right" className="h-4 w-4" />
                  </a>
                )
                : <span />}
            </nav>
          </div>
        </main>
      </div>
    );
  };
}

function blogHref(options: { page?: number }, lang: Lang): string {
  const url = new URL(
    localizeHref(routes.blog.index.href(), lang),
    "https://niapya.local",
  );
  if (options.page && options.page > 1) {
    url.searchParams.set("page", String(options.page));
  }
  return `${url.pathname}${url.search}`;
}

function formatDate(value: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "zh-cn" ? "zh-CN" : "en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
}
