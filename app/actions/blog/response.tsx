import type { I18n } from "@/i18n/index.ts";
import {
  createBlogCommentChallenge,
  listBlogComments,
} from "@/data/blog-comments.ts";
import { page } from "@/middleware/render.tsx";
import { BlogPostPage } from "@/pages/blog/post.tsx";
import type {
  CommentFormErrors,
  CommentFormValues,
} from "@/components/comments.tsx";
import type { Post } from "@/posts/index.ts";
import { routes } from "@/routes.ts";
import { MARKDOWN_HEAD_CSS } from "@/utils/markdown.ts";
import { noStore } from "@/actions/http.ts";
import { localizeHref } from "@/i18n/index.ts";

type Render = (
  content: ReturnType<typeof page>,
  init?: ResponseInit,
) => Response;

export async function renderBlogPostFailure(options: {
  render: Render;
  i18n: I18n;
  post: Post;
  values: CommentFormValues;
  errors: CommentFormErrors;
  status: number;
}): Promise<Response> {
  const [comments, challenge] = await Promise.all([
    listBlogComments(options.post.slug),
    createBlogCommentChallenge(options.post.slug, options.i18n.lang),
  ]);

  return options.render(
    page(
      <BlogPostPage
        i18n={options.i18n}
        post={options.post}
        comments={comments}
        challenge={challenge}
        values={options.values}
        errors={options.errors}
        published={false}
      />,
      articleMetadata(options.post, options.i18n),
    ),
    noStore(options.status),
  );
}

export function articleMetadata(post: Post, i18n: I18n) {
  return {
    title: `${post.title} | Niapya`,
    description: i18n.messages.blog.post.articleDescription,
    head: (
      <>
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin="anonymous"
        />
        <style data-blog-katex innerHTML={MARKDOWN_HEAD_CSS} />
      </>
    ),
  };
}

export function blogCommentSuccessHref(
  slug: string,
  lang: I18n["lang"],
): string {
  return `${
    localizeHref(routes.blog.article.href({ slug }), lang)
  }&commented=1#comments`;
}
