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
import { noStore, parseFormRequest } from "@/actions/http.ts";
import { renderCommentsFailure } from "@/actions/comments/response.tsx";
import { EMPTY_COMMENT_FORM } from "@/constants/comment-form.ts";
import {
  createCaptchaChallenge,
  listComments,
  publishComment,
} from "@/data/comments.ts";
import { createI18n, localizeHref } from "@/i18n/index.ts";
import { LangContext } from "@/middleware/locale.ts";
import { page } from "@/middleware/render.tsx";
import { CommentsPage } from "@/pages/comments/index.tsx";
import { routes } from "@/routes.ts";

export default createController(routes.comments, {
  actions: {
    async index({ get, render, url }) {
      const lang = get(LangContext);
      const i18n = createI18n(lang);
      const copy = i18n.messages.commentsPage;
      const [comments, challenge] = await Promise.all([
        listComments(),
        createCaptchaChallenge(lang),
      ]);

      return render(
        page(
          <CommentsPage
            i18n={i18n}
            comments={comments}
            challenge={challenge}
            values={EMPTY_COMMENT_FORM}
            errors={{}}
            published={url.searchParams.get("posted") === "1"}
          />,
          { title: copy.metaTitle, description: copy.metaDescription },
        ),
        noStore(),
      );
    },

    async action({ get, render, request }) {
      const lang = get(LangContext);
      const i18n = createI18n(lang);
      const copy = i18n.messages.commentsPage;
      const form = await parseFormRequest(request);

      if (!form.ok) {
        const message = form.reason === "same-origin"
          ? copy.errors.sameOrigin
          : form.reason === "too-large"
          ? copy.errors.tooLarge
          : copy.errors.invalidForm;
        return await renderCommentsFailure({
          render,
          i18n,
          values: EMPTY_COMMENT_FORM,
          errors: { form: message },
          status: form.status,
        });
      }

      const values = readCommentFormValues(form.formData);
      if (textField(form.formData, "organization").trim() !== "") {
        return redirect(successHref(lang), 303);
      }

      const parsed = s.parseSafe(
        createCommentSchema(copy, { contentRequired: false }),
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
        return await renderCommentsFailure({
          render,
          i18n,
          values,
          errors: commentIssuesToErrors(parsed.issues),
          status: 400,
        });
      }

      const result = await publishComment(
        {
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
        return await renderCommentsFailure({
          render,
          i18n,
          values,
          errors: { captcha: message },
          status: result.reason === "too-fast" ? 429 : 400,
        });
      }

      return redirect(successHref(lang), 303);
    },
  },
});

function successHref(lang: ReturnType<typeof createI18n>["lang"]): string {
  return `${
    localizeHref(routes.comments.index.href(), lang)
  }&posted=1#comments`;
}
