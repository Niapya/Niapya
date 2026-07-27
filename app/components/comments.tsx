import { ArrowUpRight, MapPin, Send } from "lucide";
import { css, type Handle } from "remix/ui";

import { EMPTY_COMMENT_FORM } from "@/constants/comment-form.ts";
import type { Lang } from "@/i18n/index.ts";
import { createDomId } from "@/utils/id.ts";
import { renderMarkdown } from "@/utils/markdown.ts";
import { Icon } from "@/components/icon.tsx";

export type CommentFormValues = {
  name: string;
  email: string;
  website: string;
  location: string;
  content: string;
};

export type CommentFormErrors = Partial<
  Record<keyof CommentFormValues | "captcha" | "captchaToken" | "form", string>
>;

export { EMPTY_COMMENT_FORM };

export type CommentEntry = {
  id: string;
  name: string;
  website: string;
  location: string;
  content: string;
  createdAt: string;
};

export type CommentFormCopy = {
  required: string;
  optional: string;
  name: string;
  namePlaceholder: string;
  email: string;
  emailPlaceholder: string;
  website: string;
  websitePlaceholder: string;
  location: string;
  locationPlaceholder: string;
  content: string;
  contentPlaceholder: string;
  markdown: string;
  submit: string;
  errorSummary: string;
  privacy?: string;
};

type CommentFormProps = {
  action: string;
  values: CommentFormValues;
  errors: CommentFormErrors;
  copy: CommentFormCopy;
  contentRequired: boolean;
};

type CommentListProps = {
  comments: readonly CommentEntry[];
  lang: Lang;
  emptyTitle: string;
  emptyDescription?: string;
  unsigned: string;
  websiteLabel: string;
};

const markdownStyle = css({
  overflowWrap: "anywhere",
  "& > :first-child": { marginTop: "0" },
  "& > :last-child": { marginBottom: "0" },
  "& p, & ul, & ol, & blockquote, & pre, & table": {
    marginBlock: "0.75rem",
  },
  "& h1, & h2, & h3, & h4": {
    marginBlock: "1.25rem 0.5rem",
    fontFamily: "var(--font-display)",
    fontWeight: "500",
    lineHeight: "1.2",
  },
  "& h1": { fontSize: "1.75rem" },
  "& h2": { fontSize: "1.5rem" },
  "& h3, & h4": { fontSize: "1.25rem" },
  "& ul, & ol": { paddingInlineStart: "1.4rem" },
  "& ul": { listStyleType: "disc" },
  "& ol": { listStyleType: "decimal" },
  "& a": {
    color: "var(--primary)",
    textDecoration: "underline",
    textUnderlineOffset: "0.2em",
  },
  "& blockquote": {
    borderInlineStart: "0.2rem solid var(--primary)",
    color: "var(--muted-foreground)",
    paddingInlineStart: "1rem",
  },
  "& code": {
    border: "1px solid var(--border)",
    borderRadius: "0.25rem",
    backgroundColor: "var(--muted)",
    color: "var(--foreground)",
    fontFamily: "var(--font-mono)",
    fontSize: "0.875em",
    padding: "0.08em 0.32em",
  },
  "& pre": {
    maxInlineSize: "100%",
    overflowX: "auto",
    border: "1px solid var(--border)",
    borderRadius: "0.25rem",
    backgroundColor: "var(--muted)",
    padding: "1rem",
    scrollbarGutter: "stable",
    tabSize: 2,
  },
  "& pre code": {
    border: "0",
    backgroundColor: "transparent",
    color: "var(--foreground)",
    fontSize: "0.875rem",
    lineHeight: "1.7",
    padding: "0",
  },
  "& table": {
    display: "block",
    maxInlineSize: "100%",
    overflowX: "auto",
    borderCollapse: "collapse",
  },
  "& th, & td": {
    border: "1px solid var(--border)",
    padding: "0.5rem 0.75rem",
    textAlign: "start",
  },
  "& img": {
    maxInlineSize: "100%",
    blockSize: "auto",
    borderRadius: "0.25rem",
  },
  "& .anchor": { display: "none" },
});

export function CommentForm(handle: Handle<CommentFormProps>) {
  return () => {
    const { action, values, errors, copy, contentRequired } = handle.props;
    const hasErrors = Object.keys(errors).length > 0;

    return (
      <>
        {hasErrors && (
          <div
            class="mb-8 border-destructive border-l-4 bg-red-50 px-5 py-4 text-red-950 text-sm dark:bg-red-950 dark:text-red-100"
            role="alert"
          >
            <p class="font-semibold">{copy.errorSummary}</p>
            {errors.form && <p class="mt-1">{errors.form}</p>}
          </div>
        )}

        <form method="post" action={action} class="space-y-8">
          <div class="sr-only" aria-hidden="true">
            <label htmlFor="organization">Organization</label>
            <input
              id="organization"
              name="organization"
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>
          <CommentField
            id="name"
            label={copy.name}
            marker={copy.required}
            value={values.name}
            placeholder={copy.namePlaceholder}
            error={errors.name}
            required
            maxLength={60}
            autoComplete="name"
          />

          <div class="grid gap-8 sm:grid-cols-2">
            <CommentField
              id="email"
              label={copy.email}
              marker={copy.optional}
              value={values.email}
              placeholder={copy.emailPlaceholder}
              error={errors.email}
              type="email"
              maxLength={160}
              autoComplete="email"
              inputMode="email"
            />
            <CommentField
              id="website"
              label={copy.website}
              marker={copy.optional}
              value={values.website}
              placeholder={copy.websitePlaceholder}
              error={errors.website}
              type="url"
              maxLength={300}
              autoComplete="url"
              inputMode="url"
            />
          </div>

          <CommentField
            id="location"
            label={copy.location}
            marker={copy.optional}
            value={values.location}
            placeholder={copy.locationPlaceholder}
            error={errors.location}
            maxLength={80}
            autoComplete="address-level2"
          />

          <div>
            <div class="mb-2 flex items-baseline justify-between gap-4">
              <label htmlFor="content" class="font-semibold text-sm">
                {copy.content}
              </label>
              <span class="font-mono text-muted-foreground text-xs uppercase">
                {contentRequired ? copy.required : copy.optional}
              </span>
            </div>
            <textarea
              id="content"
              name="content"
              value={values.content}
              placeholder={copy.contentPlaceholder}
              required={contentRequired}
              maxLength={5_000}
              rows={7}
              aria-invalid={errors.content ? "true" : undefined}
              aria-describedby={errors.content
                ? "content-error content-hint"
                : "content-hint"}
              class="block w-full resize-y rounded-sm border border-input bg-background px-4 py-3 text-base text-foreground leading-7 outline-none transition-colors placeholder:text-muted-foreground hover:border-foreground focus:border-primary focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary aria-invalid:border-destructive aria-invalid:ring-destructive"
            />
            <div class="mt-2 flex flex-wrap justify-between gap-2 text-xs">
              <p id="content-hint" class="text-muted-foreground">
                {copy.markdown}
              </p>
              {errors.content && (
                <p id="content-error" class="font-medium text-destructive">
                  {errors.content}
                </p>
              )}
            </div>
          </div>

          {copy.privacy && (
            <p class="max-w-sm text-muted-foreground text-xs leading-5">
              {copy.privacy}
            </p>
          )}

          <button
            type="submit"
            class="inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-primary px-6 py-3 font-semibold text-primary-foreground text-sm outline-none transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:ring-offset-background focus-visible:ring-ring"
          >
            <Icon icon={Send} className="h-4 w-4" />
            {copy.submit}
          </button>
        </form>
      </>
    );
  };
}

export function CommentList(handle: Handle<CommentListProps>) {
  return () => {
    const {
      comments,
      lang,
      emptyTitle,
      emptyDescription,
      unsigned,
      websiteLabel,
    } = handle.props;

    if (comments.length === 0) {
      return (
        <div class="border-border border-t py-12">
          <p class="font-display text-2xl text-muted-foreground italic">
            {emptyTitle}
          </p>
          {emptyDescription && (
            <p class="mt-2 max-w-md text-muted-foreground text-sm leading-6">
              {emptyDescription}
            </p>
          )}
        </div>
      );
    }

    return (
      <ol class="border-border border-t">
        {comments.map((comment, index) => (
          <li
            key={comment.id}
            id={createDomId("comment", comment.id)}
            class="border-b border-border py-9 sm:py-10"
          >
            <article
              aria-labelledby={createDomId("comment-author", comment.id)}
            >
              <div class="grid gap-5 sm:grid-cols-12">
                <div class="sm:col-span-4">
                  <p class="mb-4 font-mono text-primary text-xs">
                    #{String(comments.length - index).padStart(2, "0")}
                  </p>
                  <h4
                    id={createDomId("comment-author", comment.id)}
                    class="font-semibold text-base"
                  >
                    {comment.name}
                  </h4>
                  <time
                    dateTime={comment.createdAt}
                    class="mt-1 block text-muted-foreground text-xs leading-5"
                  >
                    {formatCommentDate(comment.createdAt, lang)}
                  </time>
                  {comment.location && (
                    <p class="mt-3 flex items-center gap-1.5 text-muted-foreground text-xs">
                      <Icon icon={MapPin} className="h-3.5 w-3.5" />
                      {comment.location}
                    </p>
                  )}
                  {comment.website && (
                    <a
                      href={comment.website}
                      target="_blank"
                      rel="ugc nofollow noopener noreferrer"
                      class="mt-3 inline-flex items-center gap-1.5 font-semibold text-foreground text-xs underline decoration-border underline-offset-4 outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {websiteLabel}
                      <Icon icon={ArrowUpRight} className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
                <div class="sm:col-span-8">
                  {comment.content
                    ? (
                      <div
                        class="text-base text-foreground leading-7"
                        mix={markdownStyle}
                        innerHTML={renderMarkdown(comment.content)}
                      />
                    )
                    : (
                      <p class="font-display text-muted-foreground text-xl italic">
                        {unsigned}
                      </p>
                    )}
                </div>
              </div>
            </article>
          </li>
        ))}
      </ol>
    );
  };
}

type CommentFieldProps = {
  id: keyof CommentFormValues;
  label: string;
  marker: string;
  value: string;
  placeholder: string;
  error?: string;
  type?: "text" | "email" | "url";
  required?: boolean;
  maxLength: number;
  autoComplete?: string;
  inputMode?: "text" | "email" | "url";
};

function CommentField(handle: Handle<CommentFieldProps>) {
  return () => {
    const props = handle.props;
    const errorId = createDomId(props.id, "error");
    return (
      <div>
        <div class="mb-2 flex items-baseline justify-between gap-4">
          <label htmlFor={props.id} class="font-semibold text-sm">
            {props.label}
          </label>
          <span class="font-mono text-muted-foreground text-xs uppercase">
            {props.marker}
          </span>
        </div>
        <input
          id={props.id}
          name={props.id}
          type={(props.type ?? "text") as "text"}
          value={props.value}
          placeholder={props.placeholder}
          required={props.required}
          maxLength={props.maxLength}
          autoComplete={props.autoComplete}
          inputMode={props.inputMode}
          aria-invalid={props.error ? "true" : undefined}
          aria-describedby={props.error ? errorId : undefined}
          class="block min-h-12 w-full rounded-sm border border-input bg-background px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground hover:border-foreground focus:border-primary focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary aria-invalid:border-destructive aria-invalid:ring-destructive"
        />
        {props.error && (
          <p id={errorId} class="mt-2 font-medium text-destructive text-xs">
            {props.error}
          </p>
        )}
      </div>
    );
  };
}

function formatCommentDate(value: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "zh-cn" ? "zh-CN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
