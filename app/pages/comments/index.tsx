import { css, type Handle } from "remix/ui";

import type { Comment } from "@/data/comments.ts";
import { type I18n, localizeHref } from "@/i18n/index.ts";
import { routes } from "@/routes.ts";
import {
  CommentForm,
  type CommentFormErrors,
  type CommentFormValues,
  CommentList,
} from "@/components/comments.tsx";
import { Header } from "@/components/header.tsx";
import { Icon } from "@/components/icon.tsx";

type CommentsPageProps = {
  i18n: I18n;
  comments: Comment[];
  values: CommentFormValues;
  errors: CommentFormErrors;
  published: boolean;
};

const pageGridStyle = css({
  gridTemplateColumns: "minmax(0, 0.88fr) minmax(24rem, 1.12fr)",
  "@media (max-width: 63.999rem)": {
    gridTemplateColumns: "minmax(0, 1fr)",
  },
});

export function CommentsPage(handle: Handle<CommentsPageProps>) {
  return () => {
    const { i18n, comments, values, errors, published } = handle.props;
    const lang = i18n.lang;
    const copy = i18n.messages.commentsPage;

    return (
      <div class="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
        <Header current="comments" i18n={i18n} />

        <main>
          <section class="border-b border-border">
            <div class="mx-auto max-w-8xl px-5 pt-14 pb-16 sm:px-10 sm:pt-20 sm:pb-20 lg:px-20 lg:pb-24">
              <div class="grid items-end gap-10 lg:grid-cols-12">
                <div class="lg:col-span-8">
                  <p class="mb-5 font-mono text-primary text-xs uppercase">
                    {copy.eyebrow}
                  </p>
                  <h1 class="max-w-5xl font-display font-normal text-6xl text-foreground leading-none sm:text-7xl lg:text-8xl">
                    {copy.title}
                  </h1>
                </div>
                <div class="lg:col-span-4 lg:pb-2">
                  <p class="max-w-xl text-base text-muted-foreground leading-7 sm:text-lg">
                    {copy.introduction}
                  </p>
                  <p class="mt-7 font-mono text-foreground text-xs uppercase">
                    {copy.count(comments.length)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {published && (
            <div class="border-b border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
              <div
                class="mx-auto flex max-w-8xl select-none items-center gap-3 px-5 py-4 font-medium text-sm sm:px-10 lg:px-20"
                role="status"
                aria-live="polite"
              >
                <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white">
                  <Icon name="lucide:check" className="h-4 w-4" />
                </span>
                {copy.published}
              </div>
            </div>
          )}

          <div class="mx-auto grid max-w-8xl" mix={pageGridStyle}>
            <section
              id="comment-form"
              class="border-b border-border px-5 py-14 sm:px-10 sm:py-20 lg:border-b-0 lg:border-r lg:px-20"
            >
              <div class="max-w-2xl">
                <div class="mb-10">
                  <p class="mb-3 font-mono text-primary text-xs uppercase">
                    {copy.formStep}
                  </p>
                  <h2 class="font-display font-normal text-4xl leading-tight sm:text-5xl">
                    {copy.formTitle}
                  </h2>
                  <p class="mt-4 max-w-xl text-muted-foreground text-sm leading-6">
                    {copy.formDescription}
                  </p>
                </div>

                <CommentForm
                  action={localizeHref(routes.comments.verify.href(), lang)}
                  values={values}
                  errors={errors}
                  contentRequired={false}
                  copy={{
                    ...copy,
                    content: copy.comment,
                    contentPlaceholder: copy.commentPlaceholder,
                    markdown: copy.markdownHint,
                  }}
                />
              </div>
            </section>

            <section
              id="comments"
              class="px-5 py-14 sm:px-10 sm:py-20 lg:px-20"
              aria-labelledby="comments-title"
            >
              <div class="mb-10 flex items-end justify-between gap-6">
                <div>
                  <p class="mb-3 font-mono text-primary text-xs uppercase">
                    {copy.notesStep}
                  </p>
                  <h2
                    id="comments-title"
                    class="font-display font-normal text-4xl leading-tight sm:text-5xl"
                  >
                    {copy.listTitle}
                  </h2>
                </div>
                <p class="shrink-0 select-none font-mono text-muted-foreground text-xs uppercase">
                  {copy.newestFirst}
                </p>
              </div>

              <CommentList
                comments={comments}
                lang={lang}
                emptyTitle={copy.emptyTitle}
                emptyDescription={copy.emptyDescription}
                unsigned={copy.unsigned}
                websiteLabel={copy.websiteLink}
              />
            </section>
          </div>
        </main>
      </div>
    );
  };
}
