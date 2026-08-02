import assert from "node:assert/strict";

import { blogPostCacheTag } from "@/actions/blog/cache.ts";
import { allPosts } from "@/posts/index.ts";
import { router } from "@/router.ts";
import { routes } from "@/routes.ts";

Deno.test("blog comments create a captcha only after valid submission", async () => {
  const post = allPosts[0];
  assert.ok(post, "Expected at least one blog post fixture");
  const articlePath = routes.blog.article.href({ slug: post.slug });

  const articleResponse = await router.fetch(
    new Request(`http://niapya.test${articlePath}?lang=en`),
  );
  const articleHtml = await articleResponse.text();
  assert.equal(articleResponse.status, 200);
  assert.equal(
    articleResponse.headers.get("cache-control"),
    "public, max-age=60",
  );
  assert.equal(
    articleResponse.headers.get("deno-cdn-cache-control"),
    "public, s-maxage=300, stale-while-revalidate=60",
  );
  assert.equal(
    articleResponse.headers.get("deno-cache-tag"),
    blogPostCacheTag(post.slug),
  );
  assert.equal(articleResponse.headers.get("vary"), null);
  assert.match(articleHtml, /Continue to verification/);
  assert.doesNotMatch(articleHtml, /<input[^>]+type="image"/);

  const commentPath = routes.blog.comment.href({ slug: post.slug });
  const verificationResponse = await router.fetch(
    new Request(`http://niapya.test${commentPath}?lang=en`, {
      method: "POST",
      headers: { origin: "http://niapya.test" },
      body: new URLSearchParams({
        name: "Reader",
        email: "",
        website: "",
        location: "",
        content: "A test comment that should stop at verification.",
        organization: "",
      }),
    }),
  );
  const verificationHtml = await verificationResponse.text();

  assert.equal(verificationResponse.status, 200);
  assert.match(verificationHtml, /One last check/);
  assert.match(verificationHtml, /<input[^>]+type="image"/);
  assert.match(
    verificationHtml,
    /name="captchaToken" value="[0-9A-HJKMNP-TV-Z]{26}"/,
  );
  assert.match(
    verificationHtml,
    new RegExp(
      `action="${
        commentPath.replace("/comments", "/comments/verify")
      }\\?lang=en"`,
    ),
  );
});

Deno.test("published blog article state is not cached", async () => {
  const post = allPosts[0];
  assert.ok(post, "Expected at least one blog post fixture");
  const response = await router.fetch(
    new Request(
      `http://niapya.test${
        routes.blog.article.href({ slug: post.slug })
      }?lang=en&commented=1`,
    ),
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
  assert.equal(response.headers.get("deno-cdn-cache-control"), null);
});

Deno.test("blog article varies by Accept-Language without explicit language", async () => {
  const post = allPosts[0];
  assert.ok(post, "Expected at least one blog post fixture");
  const response = await router.fetch(
    new Request(
      `http://niapya.test${routes.blog.article.href({ slug: post.slug })}`,
      { headers: { "Accept-Language": "zh-CN" } },
    ),
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("vary"), "Accept-Language");
});

Deno.test("expired blog article verification state is not cached", async () => {
  const post = allPosts[0];
  assert.ok(post, "Expected at least one blog post fixture");
  const response = await router.fetch(
    new Request(
      `http://niapya.test${
        routes.blog.article.href({ slug: post.slug })
      }?lang=en&verification=expired`,
    ),
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
  assert.equal(response.headers.get("deno-cdn-cache-control"), null);
});
