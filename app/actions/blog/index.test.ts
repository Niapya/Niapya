import assert from "node:assert/strict";

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
  assert.match(articleHtml, /Continue to verification/);
  assert.doesNotMatch(articleHtml, /type="image"/);

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
  assert.match(verificationHtml, /type="image"/);
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
