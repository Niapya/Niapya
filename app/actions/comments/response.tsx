import type {
  CommentFormErrors,
  CommentFormValues,
} from "@/components/comments.tsx";
import type { CommentCaptchaChallenge } from "@/data/comment-captcha.ts";
import { listComments } from "@/data/comments.ts";
import { type I18n, localizeHref } from "@/i18n/index.ts";
import { page } from "@/middleware/render.tsx";
import { CommentsPage } from "@/pages/comments/index.tsx";
import { CommentVerificationPage } from "@/pages/comments/verify.tsx";
import { noStore } from "@/actions/http.ts";
import { routes } from "@/routes.ts";

type Render = (
  content: ReturnType<typeof page>,
  init?: ResponseInit,
) => Response;

export async function renderCommentsFailure(options: {
  render: Render;
  i18n: I18n;
  values: CommentFormValues;
  errors: CommentFormErrors;
  status: number;
}): Promise<Response> {
  const copy = options.i18n.messages.commentsPage;
  const comments = await listComments();

  return options.render(
    page(
      <CommentsPage
        i18n={options.i18n}
        comments={comments}
        values={options.values}
        errors={options.errors}
        published={false}
      />,
      { title: copy.metaTitle, description: copy.metaDescription },
    ),
    noStore(options.status),
  );
}

export function renderCommentsVerification(options: {
  render: Render;
  i18n: I18n;
  challenge: CommentCaptchaChallenge;
  error?: string;
  status?: number;
}): Response {
  const copy = options.i18n.messages.commentsPage;
  const lang = options.i18n.lang;

  return options.render(
    page(
      <CommentVerificationPage
        i18n={options.i18n}
        current="comments"
        action={localizeHref(routes.comments.publish.href(), lang)}
        backHref={`${
          localizeHref(routes.comments.index.href(), lang)
        }#comment-form`}
        challenge={options.challenge}
        eyebrow={copy.verificationEyebrow}
        title={copy.verificationTitle}
        description={copy.verificationDescription}
        captchaAlt={copy.captchaAlt}
        backLabel={copy.verificationBack}
        error={options.error}
      />,
      { title: `${copy.verificationTitle} | Niapya` },
    ),
    noStore(options.status),
  );
}
