import * as s from "remix/data-schema";
import { redirect } from "remix/response/redirect";
import { createController } from "remix/router";

import {
  commentIssuesToErrors,
  createCaptchaAnswerSchema,
  createCommentSchema,
  getIssuePathKey,
  readCommentFormValues,
  textField,
} from "@/actions/comment-form.ts";
import { noStore, notFound, parseFormRequest } from "@/actions/http.ts";
import {
  articleMetadata,
  blogCommentSuccessHref,
  renderBlogCommentVerification,
  renderBlogPostFailure,
} from "@/actions/blog/response.tsx";
import { EMPTY_COMMENT_FORM } from "@/constants/comment-form.ts";
import {
  createBlogCommentChallenge,
  listBlogComments,
  publishBlogComment,
} from "@/data/blog-comments.ts";
import { createI18n, localizeHref } from "@/i18n/index.ts";
import { LangContext } from "@/middleware/locale.ts";
import { page } from "@/middleware/render.tsx";
import { BlogIndexPage } from "@/pages/blog/index.tsx";
import { BlogPostPage } from "@/pages/blog/post.tsx";
import { allPosts, posts } from "@/posts/index.ts";
import { routes } from "@/routes.ts";

const BLOG_PAGE_SIZE = 6;

export default createController(routes.blog, {
  actions: {
    index({ get, render, url }) {
      const lang = get(LangContext);
      const i18n = createI18n(lang);
      const copy = i18n.messages.blog.index;
      const totalPages = Math.max(
        1,
        Math.ceil(allPosts.length / BLOG_PAGE_SIZE),
      );
      const requestedPage = parsePage(url.searchParams.get("page"));
      const currentPage = Math.min(requestedPage, totalPages);
      const start = (currentPage - 1) * BLOG_PAGE_SIZE;

      return render(
        page(
          <BlogIndexPage
            i18n={i18n}
            posts={allPosts.slice(start, start + BLOG_PAGE_SIZE)}
            page={currentPage}
            totalPages={totalPages}
            totalPosts={allPosts.length}
          />,
          { title: copy.metaTitle, description: copy.metaDescription },
        ),
      );
    },

    async article({ get, params, render, url }) {
      const post = posts[params.slug];
      if (!post) return notFound();

      const lang = get(LangContext);
      const i18n = createI18n(lang);
      const comments = await listBlogComments(post.slug);
      const verificationExpired = url.searchParams.get("verification") ===
        "expired";

      return render(
        page(
          <BlogPostPage
            i18n={i18n}
            post={post}
            comments={comments}
            values={EMPTY_COMMENT_FORM}
            errors={verificationExpired
              ? { form: i18n.messages.blog.post.errors.captchaExpired }
              : {}}
            published={url.searchParams.get("commented") === "1"}
          />,
          articleMetadata(post, i18n),
        ),
        noStore(),
      );
    },

    async comment({ get, params, render, request }) {
      const post = posts[params.slug];
      if (!post) return notFound();

      const lang = get(LangContext);
      const i18n = createI18n(lang);
      const copy = i18n.messages.blog.post;
      const form = await parseFormRequest(request);

      if (!form.ok) {
        return await renderBlogPostFailure({
          render,
          i18n,
          post,
          values: EMPTY_COMMENT_FORM,
          errors: { form: formFailureMessage(form.reason, copy.errors) },
          status: form.status,
        });
      }

      const values = readCommentFormValues(form.formData);
      if (textField(form.formData, "organization").trim() !== "") {
        return redirect(blogCommentSuccessHref(post.slug, lang), 303);
      }

      const parsed = s.parseSafe(
        createCommentSchema(copy, { contentRequired: true }),
        form.formData,
        {
          locale: lang,
          errorMap(context) {
            const field = getIssuePathKey(context.path?.[0]);
            if (
              field === "name" &&
              (context.code === "type.string" ||
                context.code === "string.min_length")
            ) return copy.errors.nameRequired;
            if (
              field === "content" &&
              (context.code === "type.string" ||
                context.code === "string.min_length")
            ) return copy.errors.contentRequired;
            if (context.code === "string.max_length") {
              return copy.errors.fieldTooLong;
            }
            return undefined;
          },
        },
      );

      if (!parsed.success) {
        return await renderBlogPostFailure({
          render,
          i18n,
          post,
          values,
          errors: commentIssuesToErrors(parsed.issues),
          status: 400,
        });
      }

      const challenge = await createBlogCommentChallenge(
        { postSlug: post.slug, ...parsed.value },
        lang,
      );
      return renderBlogCommentVerification({
        render,
        i18n,
        post,
        challenge,
      });
    },

    async publishComment({ get, params, render, request }) {
      const post = posts[params.slug];
      if (!post) return notFound();

      const lang = get(LangContext);
      const i18n = createI18n(lang);
      const copy = i18n.messages.blog.post;
      const form = await parseFormRequest(request);

      if (!form.ok) {
        return new Response(formFailureMessage(form.reason, copy.errors), {
          status: form.status,
        });
      }

      const parsed = s.parseSafe(
        createCaptchaAnswerSchema(copy),
        form.formData,
      );
      if (!parsed.success) return redirect(expiredHref(post.slug, lang), 303);

      const result = await publishBlogComment(post.slug, {
        token: parsed.value.captchaToken,
        x: parsed.value["captcha.x"],
        y: parsed.value["captcha.y"],
      });

      if (result.ok || result.reason === "conflict") {
        return redirect(blogCommentSuccessHref(post.slug, lang), 303);
      }
      if (result.reason === "expired") {
        return redirect(expiredHref(post.slug, lang), 303);
      }
      if (!("input" in result)) {
        return redirect(expiredHref(post.slug, lang), 303);
      }

      const challenge = await createBlogCommentChallenge(result.input, lang);
      return renderBlogCommentVerification({
        render,
        i18n,
        post,
        challenge,
        error: result.reason === "too-fast"
          ? copy.errors.tooFast
          : copy.errors.captchaIncorrect,
        status: result.reason === "too-fast" ? 429 : 400,
      });
    },
  },
});

type FormErrors = ReturnType<
  typeof createI18n
>["messages"]["blog"]["post"]["errors"];

function formFailureMessage(
  reason: "same-origin" | "too-large" | "invalid-form",
  errors: FormErrors,
): string {
  return reason === "same-origin"
    ? errors.sameOrigin
    : reason === "too-large"
    ? errors.tooLarge
    : errors.invalidForm;
}

function expiredHref(
  slug: string,
  lang: ReturnType<typeof createI18n>["lang"],
): string {
  return `${
    localizeHref(routes.blog.article.href({ slug }), lang)
  }&verification=expired#comments`;
}

function parsePage(value: string | null): number {
  if (!value || !/^\d+$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}
