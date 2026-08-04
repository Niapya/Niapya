import type { I18n, Lang } from "@/i18n/index.ts";
import { listBlogComments } from "@/data/blog-comments.ts";
import type { CommentCaptchaChallenge } from "@/data/comment-captcha.ts";
import { page } from "@/actions/render.tsx";
import { BlogPostPage } from "@/pages/blog/post.tsx";
import { CommentVerificationPage } from "@/pages/comments/verify.tsx";
import type {
  CommentFormErrors,
  CommentFormValues,
} from "@/components/comments.tsx";
import type { Post } from "@/data/posts.ts";
import { postNeighbors } from "@/data/posts.ts";
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
  availableLanguages: readonly Lang[];
  fallback: boolean;
  values: CommentFormValues;
  errors: CommentFormErrors;
  status: number;
  url: URL;
}): Promise<Response> {
  const comments = await listBlogComments(options.post.slug);
  const neighbors = postNeighbors(options.post.slug, options.i18n.lang);

  return options.render(
    page(
      <BlogPostPage
        i18n={options.i18n}
        post={options.post}
        availableLanguages={options.availableLanguages}
        fallback={options.fallback}
        comments={comments}
        previousPost={neighbors.previous}
        nextPost={neighbors.next}
        values={options.values}
        errors={options.errors}
        published={false}
        shareUrl={blogPostShareUrl(
          options.post,
          options.i18n.lang,
          options.url,
        )}
      />,
      articleMetadata(options.post, options.i18n),
    ),
    noStore(options.status),
  );
}

export function blogPostShareUrl(
  post: Post,
  lang: I18n["lang"],
  base: URL,
): string {
  return new URL(
    localizeHref(routes.blog.article.href({ slug: post.slug }), lang),
    base,
  ).href;
}

export function renderBlogCommentVerification(options: {
  render: Render;
  i18n: I18n;
  post: Post;
  challenge: CommentCaptchaChallenge;
  error?: string;
  status?: number;
}): Response {
  const copy = options.i18n.messages.blog.post;
  const lang = options.i18n.lang;
  const articleHref = localizeHref(
    routes.blog.article.href({ slug: options.post.slug }),
    lang,
  );

  return options.render(
    page(
      <CommentVerificationPage
        i18n={options.i18n}
        current="blog"
        action={localizeHref(
          routes.blog.publishComment.href({ slug: options.post.slug }),
          lang,
        )}
        backHref={`${articleHref}#comments`}
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

export function articleMetadata(post: Post, i18n: I18n) {
  return {
    title: `${post.title} | Niapya`,
    description: post.summary ?? i18n.messages.blog.post.articleDescription,
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
