import { css, cx } from "@twind/core";
import type { Handle } from "remix/ui";

import type { BlogComment } from "@/data/blog-comments.ts";
import {
  type I18n,
  type Lang,
  LANGUAGE_CONFIG,
  localizeHref,
} from "@/i18n/index.ts";
import type { Post } from "@/data/posts.ts";
import { routes } from "@/routes.ts";
import { ScrollDrivenAnimation } from "@/components/animation/scroll-driven.tsx";
import {
  CommentForm,
  type CommentFormErrors,
  type CommentFormValues,
  CommentList,
} from "@/components/comments.tsx";
import { Header } from "@/components/header.tsx";
import { Icon } from "@/components/icon.tsx";
import {
  type MarkdownDocument,
  type MarkdownSection,
  renderMarkdown,
  renderMarkdownDocument,
} from "@/utils/markdown.ts";
import { blogPostTitleTransitionName } from "./view-transition.ts";
import { ShareMenu } from "./share.tsx";

type BlogPostPageProps = {
  i18n: I18n;
  post: Post;
  availableLanguages: readonly Lang[];
  fallback: boolean;
  previousPost: Post | undefined;
  nextPost: Post | undefined;
  comments: readonly BlogComment[];
  values: CommentFormValues;
  errors: CommentFormErrors;
  published: boolean;
  shareUrl: string;
};

const articleStyle = css({
  overflowWrap: "anywhere",
  "& h1, & h2, & h3, & h4": {
    fontFamily: "var(--font-display)",
    fontWeight: "500",
    letterSpacing: "0",
    scrollMarginTop: "2rem",
  },
  "& a": { color: "var(--primary)", textUnderlineOffset: "0.2em" },
  "& :not(pre) > code": {
    border: "1px solid var(--border)",
    borderRadius: "0.25rem",
    backgroundColor: "var(--muted)",
    color: "var(--foreground)",
    fontFamily: "var(--font-mono)",
    fontSize: "0.88em",
    padding: "0.1em 0.35em",
  },
  "& .highlight": {
    maxInlineSize: "100%",
    overflow: "hidden",
    borderRadius: "0.25rem",
    backgroundColor: "var(--muted)",
    color: "var(--foreground)",
    boxShadow: "inset 0 0 0 1px var(--border)",
    marginBlock: "2rem",
  },
  "& .highlight pre": {
    margin: "0",
    maxInlineSize: "100%",
    overflowX: "auto",
    backgroundColor: "transparent",
    color: "inherit",
    fontFamily: "var(--font-mono)",
    fontSize: "0.875rem",
    lineHeight: "1.7",
    padding: "1.25rem",
    scrollbarGutter: "stable",
    tabSize: 2,
  },
  "& .highlight code": {
    border: "0",
    backgroundColor: "transparent",
    color: "inherit",
    padding: "0",
  },
  "& .token.comment, & .token.prolog, & .token.doctype, & .token.cdata": {
    color: "var(--muted-foreground)",
    fontStyle: "italic",
  },
  "& .token.punctuation": { color: "var(--muted-foreground)" },
  "& .token.property, & .token.tag, & .token.boolean, & .token.number, & .token.constant, & .token.symbol, & .token.deleted":
    {
      color: "var(--destructive)",
    },
  "& .token.selector, & .token.attr-name, & .token.string, & .token.char, & .token.builtin, & .token.inserted":
    {
      color: "var(--foreground)",
    },
  "& .token.operator, & .token.entity, & .token.url, & .token.keyword, & .token.atrule, & .token.attr-value":
    {
      color: "var(--primary)",
    },
  "& .token.function, & .token.class-name, & .token.regex, & .token.important, & .token.variable":
    {
      color: "var(--foreground)",
      fontWeight: "600",
    },
  "& .token.bold, & .token.important": { fontWeight: "700" },
  "& .token.italic": { fontStyle: "italic" },
  "& .katex": { fontSize: "1.08em" },
  "& .katex-display": {
    maxInlineSize: "100%",
    overflowX: "auto",
    overflowY: "hidden",
    paddingBlock: "0.5rem",
  },
  "& .anchor": { display: "none" },
});

const articleLayoutStyle = css({
  boxSizing: "border-box",
  inlineSize: "100%",
  marginInline: "auto",
  maxInlineSize: "48rem",
  minInlineSize: "0",
  paddingInlineEnd: "1.25rem",
  paddingInlineStart: "4rem",
  "@media (min-width: 40rem)": {
    paddingInlineEnd: "2.5rem",
    paddingInlineStart: "4rem",
  },
  "@media (min-width: 80rem)": {
    paddingInlineStart: "2.5rem",
  },
});

const articleContentStyle = css({
  minInlineSize: "0",
  paddingBlock: "3.5rem",
  "@media (min-width: 40rem)": {
    paddingBlock: "5rem",
  },
});

const articleTimelineStyle = css({
  display: "grid",
  gridTemplateColumns: "0 minmax(0, 1fr)",
  viewTimelineAxis: "block",
  viewTimelineName: "--article-reading",
});

const timelineAsideStyle = css({
  blockSize: "100dvh",
  display: "block",
  inlineSize: "3.25rem",
  insetBlockStart: "0",
  isolation: "isolate",
  paddingBlock: "1rem",
  paddingInlineStart: "0.75rem",
  pointerEvents: "none",
  position: "sticky",
  zIndex: "60",
  "&::before": {
    background:
      "linear-gradient(to left, transparent 0%, color-mix(in oklab, var(--background) 32%, transparent) 24%, color-mix(in oklab, var(--background) 86%, transparent) 64%, var(--background) 88%)",
    boxShadow: "-0.5rem 0 0.75rem var(--background)",
    content: '""',
    filter: "blur(0.25rem)",
    inlineSize: "3rem",
    insetBlock: "-1rem",
    insetInlineStart: "-0.75rem",
    pointerEvents: "none",
    position: "absolute",
    zIndex: "0",
  },
  "@media (min-width: 80rem)": {
    inlineSize: "7rem",
    paddingBlock: "1.25rem",
    paddingInlineStart: "1.25rem",
    "&::before": {
      background:
        "linear-gradient(to left, transparent 0%, color-mix(in oklab, var(--background) 38%, transparent) 18%, color-mix(in oklab, var(--background) 92%, transparent) 58%, var(--background) 82%)",
      inlineSize: "7rem",
      boxShadow: "-1rem 0 1.5rem var(--background)",
      filter: "blur(0.5rem)",
      insetBlock: "-0.75rem",
      insetInlineStart: "-0.5rem",
    },
  },
});

const timelineRailStyle = css({
  "& [data-timeline-line]": {
    borderRadius: "9999px",
    inlineSize: "var(--timeline-short)",
    overflow: "hidden",
    transitionProperty: "inline-size, opacity, transform",
    transitionDuration: "240ms",
    transitionTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
  },
  "&:hover [data-timeline-line], &:focus-within [data-timeline-line]": {
    inlineSize: "var(--timeline-long)",
  },
  "&:hover [data-timeline-line]": {
    transform: "translateX(0.125rem)",
  },
});

const TARGET_TIMELINE_MARKS = 48;
const MIN_CONTENT_MARKS = 24;
const MAX_CONTENT_MARKS = 36;
const WORDS_PER_MINUTE = 200;

type TimelineMark = {
  key: string;
  progress: number;
  section?: MarkdownSection;
};

function totalWords(document: MarkdownDocument): number {
  return document.leadWordCount +
    document.sections.reduce((sum, section) => sum + section.wordCount, 0);
}

export function BlogPostPage(handle: Handle<BlogPostPageProps>) {
  return () => {
    const {
      lang,
      post,
      availableLanguages,
      fallback,
      previousPost,
      nextPost,
      comments,
      values,
      errors,
      published,
      shareUrl,
    } = {
      ...handle.props,
      lang: handle.props.i18n.lang,
    };
    const copy = handle.props.i18n.messages.blog.post;
    const markdownDocument = renderMarkdownDocument(post.content);
    const readingMinutes = Math.max(
      1,
      Math.ceil(totalWords(markdownDocument) / WORDS_PER_MINUTE),
    );
    const timelineSections: readonly MarkdownSection[] = [
      {
        id: "article-start",
        title: post.title,
        depth: 1,
        wordCount: markdownDocument.leadWordCount,
      },
      ...markdownDocument.sections,
    ];

    return (
      <div class="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
        <Header current="blog" i18n={handle.props.i18n} />

        <main>
          <article lang={LANGUAGE_CONFIG[post.language].htmlLang}>
            <header id="article-start" class="border-b border-border">
              <div class="mx-auto max-w-5xl px-5 pt-16 pb-14 sm:px-10 sm:pt-22 sm:pb-18 lg:px-20">
                <a
                  href={localizeHref(routes.blog.index.href(), lang)}
                  class="mb-10 inline-flex w-fit cursor-pointer select-none items-center gap-2 text-muted-foreground text-sm outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Icon name="lucide:arrow-left" className="h-4 w-4" />
                  {copy.back}
                </a>
                {(post.generated || fallback) && (
                  <div class="mb-7 flex flex-wrap items-center gap-3">
                    {post.generated && (
                      <span class="inline-flex items-center gap-2 border border-primary bg-primary px-3 py-2 font-semibold text-primary-foreground text-sm">
                        <Icon name="lucide:sparkles" className="h-4 w-4" />
                        {copy.generatedNotice}
                      </span>
                    )}
                    {fallback && (
                      <span
                        class="border border-border bg-muted px-3 py-2 text-muted-foreground text-sm"
                        role="status"
                      >
                        {copy.languageFallback(
                          LANGUAGE_CONFIG[post.language].nativeLabel,
                        )}
                      </span>
                    )}
                  </div>
                )}
                <h1
                  class="font-display font-normal text-5xl leading-none sm:text-6xl lg:text-7xl"
                  style={{
                    viewTransitionName: blogPostTitleTransitionName(post.slug),
                  }}
                >
                  {post.title}
                </h1>
                <div class="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-muted-foreground text-xs uppercase">
                  <span>
                    {copy.created}{" "}
                    <time dateTime={post.createdAt}>
                      {formatPostDate(post.createdAt, lang)}
                    </time>
                  </span>
                  <span aria-hidden="true">/</span>
                  <span>
                    {copy.updated}{" "}
                    <time dateTime={post.updatedAt}>
                      {formatPostDate(post.updatedAt, lang)}
                    </time>
                  </span>
                  <span aria-hidden="true">/</span>
                  <span>{copy.readingTime(readingMinutes)}</span>
                  <span aria-hidden="true">/</span>
                  <a
                    href="#comments"
                    class="cursor-pointer select-none outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {copy.comments(comments.length)}
                  </a>
                  <span aria-hidden="true">/</span>
                  <ShareMenu
                    url={shareUrl}
                    title={post.title}
                    copy={{
                      share: copy.share,
                      shareLabel: copy.shareLabel,
                    }}
                  />
                </div>
                <nav
                  aria-label={copy.languageVersions}
                  class="mt-7 flex flex-wrap items-center gap-2"
                >
                  <span class="mr-2 inline-flex items-center gap-2 font-mono text-muted-foreground text-xs uppercase">
                    <Icon name="lucide:languages" className="h-4 w-4" />
                    {copy.languageVersions}
                  </span>
                  {availableLanguages.map((language) => (
                    <a
                      key={language}
                      href={localizeHref(
                        routes.blog.article.href({ slug: post.slug }),
                        language,
                      )}
                      aria-current={post.language === language
                        ? "page"
                        : undefined}
                      title={post.language === language
                        ? copy.currentLanguage
                        : undefined}
                      class={post.language === language
                        ? "border border-foreground bg-foreground px-3 py-2 font-semibold text-background text-sm"
                        : "border border-border px-3 py-2 text-muted-foreground text-sm outline-none transition-colors hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"}
                    >
                      {LANGUAGE_CONFIG[language].nativeLabel}
                    </a>
                  ))}
                </nav>
              </div>
            </header>

            <div class={articleTimelineStyle}>
              <aside class={timelineAsideStyle}>
                <ReadingTimeline
                  label={copy.timeline}
                  sections={timelineSections}
                />
              </aside>
              <div class={articleLayoutStyle}>
                <div class={articleContentStyle}>
                  {post.summary && (
                    <section
                      aria-labelledby="article-summary-title"
                      class="mb-14 border-l-4 border-primary bg-muted px-6 py-6 sm:px-8"
                    >
                      <h2
                        id="article-summary-title"
                        class="mb-4 flex items-center gap-2 font-mono font-semibold text-primary text-xs uppercase"
                      >
                        <Icon name="lucide:sparkles" className="h-4 w-4" />
                        {copy.summary}
                      </h2>
                      <div
                        class={cx(
                          "dark:prose-invert prose prose-neutral max-w-none text-foreground",
                          articleStyle,
                        )}
                        innerHTML={renderMarkdown(post.summary)}
                      />
                    </section>
                  )}
                  <div
                    class={cx(
                      "dark:prose-invert prose prose-neutral max-w-none cursor-text select-text",
                      articleStyle,
                    )}
                    innerHTML={markdownDocument.html}
                  />
                </div>
              </div>
            </div>
          </article>

          <nav
            aria-label={copy.postNavigation}
            class="mx-auto max-w-5xl px-5 sm:px-10 lg:px-20"
          >
            <div class="grid grid-cols-2 gap-6 border-b border-border py-10">
              {previousPost
                ? (
                  <a
                    href={localizeHref(
                      routes.blog.article.href({ slug: previousPost.slug }),
                      lang,
                    )}
                    class="group flex min-w-0 flex-col cursor-pointer gap-2 outline-none"
                  >
                    <span class="font-mono text-muted-foreground text-xs uppercase">
                      {copy.previousPost}
                    </span>
                    <span
                      class="line-clamp-2 font-display text-xl leading-snug transition-colors group-hover:text-primary group-focus-visible:text-primary"
                      style={{
                        viewTransitionName: blogPostTitleTransitionName(
                          previousPost.slug,
                        ),
                      }}
                    >
                      {previousPost.title}
                    </span>
                  </a>
                )
                : <span />}
              {nextPost
                ? (
                  <a
                    href={localizeHref(
                      routes.blog.article.href({ slug: nextPost.slug }),
                      lang,
                    )}
                    class="group flex min-w-0 flex-col cursor-pointer items-end gap-2 text-right outline-none"
                  >
                    <span class="font-mono text-muted-foreground text-xs uppercase">
                      {copy.nextPost}
                    </span>
                    <span
                      class="line-clamp-2 font-display text-xl leading-snug transition-colors group-hover:text-primary group-focus-visible:text-primary"
                      style={{
                        viewTransitionName: blogPostTitleTransitionName(
                          nextPost.slug,
                        ),
                      }}
                    >
                      {nextPost.title}
                    </span>
                  </a>
                )
                : <span />}
            </div>
          </nav>

          <section id="comments" class="border-border border-t bg-muted">
            <div class="mx-auto max-w-8xl px-5 pt-14 pb-16 sm:px-10 sm:pt-20 sm:pb-20 lg:px-20">
              <div class="grid gap-8 border-b border-border pb-12 lg:grid-cols-12">
                <div class="lg:col-span-7">
                  <p class="mb-4 font-mono text-primary text-xs uppercase">
                    {copy.discussionEyebrow}
                  </p>
                  <h2 class="font-display font-normal text-4xl leading-tight sm:text-5xl">
                    {copy.discussionTitle}
                  </h2>
                </div>
                <div class="lg:col-span-5 lg:self-end">
                  <p class="max-w-xl text-muted-foreground leading-7">
                    {copy.discussionDescription}
                  </p>
                </div>
              </div>

              {published && (
                <div
                  class="mt-8 flex select-none items-center gap-3 border border-emerald-300 bg-emerald-50 px-5 py-4 text-emerald-950 text-sm dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
                  role="status"
                >
                  <Icon name="lucide:check" className="h-5 w-5" />
                  {copy.published}
                </div>
              )}

              <div class="grid gap-14 py-12 lg:grid-cols-12 lg:gap-16 lg:py-16">
                <div class="lg:col-span-5">
                  <h3 class="font-display text-3xl">{copy.formTitle}</h3>
                  <div class="mt-8">
                    <CommentForm
                      action={localizeHref(
                        routes.blog.comment.href({ slug: post.slug }),
                        lang,
                      )}
                      values={values}
                      errors={errors}
                      contentRequired
                      copy={copy}
                    />
                  </div>
                </div>

                <div class="lg:col-span-7">
                  <div class="flex items-center justify-between gap-4">
                    <h3 class="font-display text-3xl">{copy.listTitle}</h3>
                    <span class="inline-flex select-none items-center gap-2 font-mono text-muted-foreground text-xs uppercase">
                      <Icon name="lucide:message-square" className="h-4 w-4" />
                      {copy.comments(comments.length)}
                    </span>
                  </div>

                  <div class="mt-5">
                    <CommentList
                      comments={comments}
                      lang={lang}
                      emptyTitle={copy.empty}
                      unsigned={copy.empty}
                      websiteLabel={copy.websiteLink}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  };
}

type ReadingTimelineProps = {
  label: string;
  sections: readonly MarkdownSection[];
};

function ReadingTimeline(handle: Handle<ReadingTimelineProps>) {
  return () => {
    const marks = createTimelineMarks(handle.props.sections);

    return (
      <nav
        aria-label={handle.props.label}
        class={cx(
          "pointer-events-auto relative z-10 h-full select-none",
          timelineRailStyle,
        )}
        data-reading-timeline
      >
        <ol class="m-0 flex h-full flex-col list-none p-0">
          {marks.map((mark, index) => {
            const nextProgress = marks[index + 1]?.progress ?? 100;
            const end = Math.max(mark.progress + 0.01, nextProgress);

            return (
              <li
                key={mark.key}
                class="relative min-h-0 flex-1"
                data-reading-tick={mark.section ? "heading" : "content"}
              >
                <ScrollDrivenAnimation
                  class="h-full"
                  timeline="--article-reading"
                  range={`cover ${mark.progress}% cover ${end}%`}
                  keyframes={{
                    from: {
                      color: "var(--border)",
                    },
                    to: {
                      color: "var(--foreground)",
                    },
                  }}
                >
                  <div class="flex h-full items-start justify-start">
                    {mark.section
                      ? (
                        <a
                          href={`#${mark.section.id}`}
                          class="group relative flex h-full min-h-2 w-full cursor-pointer items-center justify-start text-current outline-none"
                        >
                          <span
                            class="block h-1 max-w-full bg-current"
                            data-timeline-line
                            style={timelineMarkerSize(mark.section.depth)}
                          />
                          <span
                            role="tooltip"
                            class="pointer-events-none absolute top-1/2 left-full z-20 ml-3 w-max max-w-64 -translate-x-2 -translate-y-1/2 rounded-sm border border-border bg-popover px-3 py-2 font-sans text-popover-foreground text-xs leading-5 opacity-0 shadow-sm transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
                          >
                            {mark.section.title}
                          </span>
                        </a>
                      )
                      : (
                        <span class="flex h-full w-full items-center justify-start">
                          <span
                            class="block h-1 max-w-full bg-current"
                            data-timeline-line
                            style={{
                              "--timeline-short": "0.5rem",
                              "--timeline-long": "min(1.25rem, 54%)",
                            }}
                          />
                        </span>
                      )}
                  </div>
                </ScrollDrivenAnimation>
              </li>
            );
          })}
        </ol>
      </nav>
    );
  };
}

function createTimelineMarks(
  sections: readonly MarkdownSection[],
): readonly TimelineMark[] {
  const totalWords = sections.reduce(
    (total, section) => total + section.wordCount,
    0,
  );
  const contentMarkCount = Math.max(
    MIN_CONTENT_MARKS,
    Math.min(MAX_CONTENT_MARKS, TARGET_TIMELINE_MARKS - sections.length),
  );
  const marks: TimelineMark[] = [];
  let wordsBeforeSection = 0;

  for (const section of sections) {
    marks.push({
      key: `heading-${section.id}`,
      progress: percentage(wordsBeforeSection, totalWords),
      section,
    });

    wordsBeforeSection += section.wordCount;
  }

  for (let index = 1; index <= contentMarkCount; index += 1) {
    marks.push({
      key: `content-${index}`,
      progress: percentage(index, contentMarkCount + 1),
    });
  }

  return marks.sort((left, right) => {
    const progressDifference = left.progress - right.progress;
    if (progressDifference !== 0) return progressDifference;
    if (left.section && !right.section) return -1;
    if (!left.section && right.section) return 1;
    return left.key.localeCompare(right.key);
  });
}

function percentage(value: number, total: number): number {
  return Number(((value / total) * 100).toFixed(4));
}

function timelineMarkerSize(depth: number): Record<string, string> {
  if (depth <= 1) {
    return {
      "--timeline-short": "1.25rem",
      "--timeline-long": "min(4rem, 100%)",
    };
  }
  if (depth === 2) {
    return {
      "--timeline-short": "1.125rem",
      "--timeline-long": "min(3.25rem, 88%)",
    };
  }
  if (depth === 3) {
    return {
      "--timeline-short": "1rem",
      "--timeline-long": "min(2.5rem, 70%)",
    };
  }
  if (depth === 4) {
    return {
      "--timeline-short": "0.875rem",
      "--timeline-long": "min(2rem, 54%)",
    };
  }
  if (depth === 5) {
    return {
      "--timeline-short": "0.75rem",
      "--timeline-long": "min(1.75rem, 44%)",
    };
  }
  return {
    "--timeline-short": "0.625rem",
    "--timeline-long": "min(1.5rem, 36%)",
  };
}

function formatPostDate(value: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "zh-cn" ? "zh-CN" : "en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
}
