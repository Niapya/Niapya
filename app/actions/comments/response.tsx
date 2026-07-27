import type {
  CommentFormErrors,
  CommentFormValues,
} from "@/components/comments.tsx";
import { createCaptchaChallenge, listComments } from "@/data/comments.ts";
import type { I18n } from "@/i18n/index.ts";
import { page } from "@/middleware/render.tsx";
import { CommentsPage } from "@/pages/comments/index.tsx";
import { noStore } from "@/actions/http.ts";

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
  const [comments, challenge] = await Promise.all([
    listComments(),
    createCaptchaChallenge(options.i18n.lang),
  ]);

  return options.render(
    page(
      <CommentsPage
        i18n={options.i18n}
        comments={comments}
        challenge={challenge}
        values={options.values}
        errors={options.errors}
        published={false}
      />,
      { title: copy.metaTitle, description: copy.metaDescription },
    ),
    noStore(options.status),
  );
}
