import * as s from "remix/data-schema";
import { redirect } from "remix/response/redirect";
import { createController } from "remix/router";

import {
  commentsPageResponseInit,
  invalidateCommentsCache,
} from "@/actions/comments/cache.ts";
import {
  commentIssuesToErrors,
  createCaptchaAnswerSchema,
  createCommentSchema,
  getIssuePathKey,
  readCommentFormValues,
  textField,
} from "@/actions/comment-form.ts";
import { parseFormRequest } from "@/actions/http.ts";
import {
  renderCommentsFailure,
  renderCommentsVerification,
} from "@/actions/comments/response.tsx";
import { EMPTY_COMMENT_FORM } from "@/constants/index.ts";
import {
  createCaptchaChallenge,
  listComments,
  publishComment,
} from "@/data/comments.ts";
import { createI18n, localizeHref } from "@/i18n/index.ts";
import { log } from "@/lib/log.ts";
import { LangContext } from "@/middleware/locale.ts";
import { page } from "@/middleware/render.tsx";
import { CommentsPage } from "@/pages/comments/index.tsx";
import { routes } from "@/routes.ts";

export default createController(routes.comments, {
  actions: {
    async index({ get, render, request, url }) {
      const lang = get(LangContext);
      const i18n = createI18n(lang);
      const copy = i18n.messages.commentsPage;
      const comments = await listComments();
      const verificationExpired = url.searchParams.get("verification") ===
        "expired";

      return render(
        page(
          <CommentsPage
            i18n={i18n}
            comments={comments}
            values={EMPTY_COMMENT_FORM}
            errors={verificationExpired
              ? { form: copy.errors.captchaExpired }
              : {}}
            published={url.searchParams.get("posted") === "1"}
          />,
          { title: copy.metaTitle, description: copy.metaDescription },
        ),
        commentsPageResponseInit(request, url),
      );
    },

    async verify({ get, render, request }) {
      const lang = get(LangContext);
      const i18n = createI18n(lang);
      const copy = i18n.messages.commentsPage;
      const form = await parseFormRequest(request);

      if (!form.ok) {
        return await renderCommentsFailure({
          render,
          i18n,
          values: EMPTY_COMMENT_FORM,
          errors: { form: formFailureMessage(form.reason, copy.errors) },
          status: form.status,
        });
      }

      const values = readCommentFormValues(form.formData);
      if (textField(form.formData, "organization").trim() !== "") {
        log.warn("Comment form rejected by honeypot", {
          pathname: new URL(request.url).pathname,
        });
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
            return undefined;
          },
        },
      );

      if (!parsed.success) {
        log.warn("Comment form validation failed", {
          pathname: new URL(request.url).pathname,
          issueCount: parsed.issues.length,
        });
        return await renderCommentsFailure({
          render,
          i18n,
          values,
          errors: commentIssuesToErrors(parsed.issues),
          status: 400,
        });
      }

      const challenge = await createCaptchaChallenge(parsed.value, lang);
      log.info("Comment captcha challenge created", {
        pathname: new URL(request.url).pathname,
      });
      return renderCommentsVerification({ render, i18n, challenge });
    },

    async publish({ get, render, request }) {
      const lang = get(LangContext);
      const i18n = createI18n(lang);
      const copy = i18n.messages.commentsPage;
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
      if (!parsed.success) {
        log.warn("Comment captcha validation failed", {
          pathname: new URL(request.url).pathname,
          issueCount: parsed.issues.length,
        });
        return redirect(expiredHref(lang), 303);
      }

      const result = await publishComment({
        token: parsed.value.captchaToken,
        x: parsed.value["captcha.x"],
        y: parsed.value["captcha.y"],
      });

      if (result.ok || result.reason === "conflict") {
        if (result.ok) {
          await invalidateCommentsCache();
        }
        log.info("Comment published", {
          pathname: new URL(request.url).pathname,
          result: result.ok ? "ok" : "conflict",
        });
        return redirect(successHref(lang), 303);
      }
      if (result.reason === "expired") {
        log.warn("Comment captcha expired", {
          pathname: new URL(request.url).pathname,
        });
        return redirect(expiredHref(lang), 303);
      }
      if (!("input" in result)) {
        log.warn("Comment captcha submission failed", {
          pathname: new URL(request.url).pathname,
          reason: result.reason,
        });
        return redirect(expiredHref(lang), 303);
      }

      const challenge = await createCaptchaChallenge(result.input, lang);
      log.warn("Comment captcha rejected", {
        pathname: new URL(request.url).pathname,
        reason: result.reason,
      });
      return renderCommentsVerification({
        render,
        i18n,
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
>["messages"]["commentsPage"]["errors"];

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

function successHref(lang: ReturnType<typeof createI18n>["lang"]): string {
  return `${
    localizeHref(routes.comments.index.href(), lang)
  }&posted=1#comments`;
}

function expiredHref(lang: ReturnType<typeof createI18n>["lang"]): string {
  return `${
    localizeHref(routes.comments.index.href(), lang)
  }&verification=expired#comment-form`;
}
