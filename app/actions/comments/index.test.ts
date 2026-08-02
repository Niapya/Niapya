import assert from "node:assert/strict";

import { router } from "@/router.ts";

Deno.test("comments page does not create a captcha before submission", async () => {
  const response = await router.fetch(
    new Request("http://niapya.test/comments?lang=en"),
  );
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Continue to verification/);
  assert.doesNotMatch(html, /type="image"/);
  assert.doesNotMatch(html, /name="captchaToken"/);
});

Deno.test("valid comment submission renders the verification step", async () => {
  const body = new URLSearchParams({
    name: "Visitor",
    email: "",
    website: "",
    location: "",
    content: "Hello from the test suite.",
    organization: "",
  });
  const response = await router.fetch(
    new Request("http://niapya.test/comments?lang=en", {
      method: "POST",
      headers: { origin: "http://niapya.test" },
      body,
    }),
  );
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /One last check|Verify your message/);
  assert.match(html, /type="image"/);
  assert.match(html, /name="captchaToken" value="[0-9A-HJKMNP-TV-Z]{26}"/);
  assert.match(html, /action="\/comments\/verify\?lang=en"/);
});
