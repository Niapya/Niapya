import assert from "node:assert/strict";

import {
  createCaptchaChallenge,
  type NewComment,
  publishComment,
} from "@/data/comments.ts";

Deno.test("captcha challenge keeps the pending comment in KV until verification", async () => {
  const input: NewComment = {
    name: "KV Visitor",
    email: "visitor@example.com",
    website: "",
    location: "Test region",
    content: "Pending comment",
  };
  const challenge = await createCaptchaChallenge(input, "en");
  const answer = { token: challenge.token, x: 999, y: 999 };

  const firstAttempt = await publishComment(answer);
  assert.deepEqual(firstAttempt, {
    ok: false,
    reason: "incorrect",
    input,
  });

  assert.deepEqual(await publishComment(answer), {
    ok: false,
    reason: "expired",
  });
});
