import * as s from "remix/data-schema";
import { redirect } from "remix/response/redirect";
import { createController } from "remix/router";

import {
  commentIssuesToErrors,
  createCommentSchema,
  getIssuePathKey,
  readCommentFormValues,
  textField,
} from "@/actions/comment-form.ts";
import { noStore, notFound, parseFormRequest } from "@/actions/http.ts";
import {
  articleMetadata,
  blogCommentSuccessHref,
  renderBlogPostFailure,
} from "@/actions/blog/response.tsx";
import { EMPTY_COMMENT_FORM } from "@/constants/comment-form.ts";
import {
  createBlogCommentChallenge,
  listBlogComments,
  publishBlogComment,
} from "@/data/blog-comments.ts";
import { createI18n } from "@/i18n/index.ts";
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
      const [comments, challenge] = await Promise.all([
        listBlogComments(post.slug),
        createBlogCommentChallenge(post.slug, lang),
      ]);

      return render(
        page(
          <BlogPostPage
            i18n={i18n}
            post={post}
            comments={comments}
            challenge={challenge}
            values={EMPTY_COMMENT_FORM}
            errors={{}}
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
        const message = form.reason === "same-origin"
          ? copy.errors.sameOrigin
          : form.reason === "too-large"
          ? copy.errors.tooLarge
          : copy.errors.invalidForm;
        return await renderBlogPostFailure({
          render,
          i18n,
          post,
          values: EMPTY_COMMENT_FORM,
          errors: { form: message },
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
            if (field === "captcha.x" || field === "captcha.y") {
              return copy.errors.captchaRequired;
            }
            if (field === "captchaToken") return copy.errors.captchaExpired;
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

      const result = await publishBlogComment(
        {
          postSlug: post.slug,
          name: parsed.value.name,
          email: parsed.value.email,
          website: parsed.value.website,
          location: parsed.value.location,
          content: parsed.value.content,
        },
        {
          token: parsed.value.captchaToken,
          x: parsed.value["captcha.x"],
          y: parsed.value["captcha.y"],
        },
      );

      if (!result.ok) {
        const message = result.reason === "too-fast"
          ? copy.errors.tooFast
          : result.reason === "incorrect"
          ? copy.errors.captchaIncorrect
          : copy.errors.captchaExpired;
        return await renderBlogPostFailure({
          render,
          i18n,
          post,
          values,
          errors: { captcha: message },
          status: result.reason === "too-fast" ? 429 : 400,
        });
      }

      return redirect(blogCommentSuccessHref(post.slug, lang), 303);
    },
  },
});

function parsePage(value: string | null): number {
  if (!value || !/^\d+$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}
