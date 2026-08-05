import { IS_TEST } from "@/constants/index.ts";

import type { Lang } from "@/i18n/index.ts";
import { createId } from "@/utils/id.ts";
import { atomic, createKvFeature } from "@/lib/kv.ts";
import {
  COMMENT_CAPTCHA_HEIGHT,
  COMMENT_CAPTCHA_WIDTH,
  type CommentCaptchaAnswer,
  type CommentCaptchaChallenge,
  type CommentCaptchaTarget,
  generateCommentCaptcha,
  matchesCommentCaptcha,
} from "./comment-captcha.ts";

const blogKv = createKvFeature("blog");
const CHALLENGE_TTL_MS = 10 * 60 * 1000;
const MINIMUM_COMPLETION_MS = IS_TEST ? 0 : 1_500;

type ChallengeRecord = {
  input: NewBlogComment;
  target: CommentCaptchaTarget;
  createdAt: number;
};

export type BlogComment = {
  id: string;
  postSlug: string;
  name: string;
  email: string;
  website: string;
  location: string;
  content: string;
  createdAt: string;
};

export type NewBlogComment = Omit<BlogComment, "id" | "createdAt">;

export type BlogCommentChallenge = CommentCaptchaChallenge;

export type PublishBlogCommentResult =
  | { ok: true; comment: BlogComment }
  | { ok: false; reason: "expired" | "conflict" }
  | {
    ok: false;
    reason: "incorrect" | "too-fast";
    input: NewBlogComment;
  };

export async function createBlogCommentChallenge(
  input: NewBlogComment,
  lang: Lang,
): Promise<BlogCommentChallenge> {
  // KV keeps the pending draft available across short-lived server instances.
  for (let attempt = 0; attempt < 3; attempt++) {
    const createdAt = Date.now();
    const captcha = await generateCommentCaptcha(
      createdAt + CHALLENGE_TTL_MS,
      lang,
    );
    const token = createId();
    const key = ["comment-challenges", token] as const;
    const result = await blogKv.commit([
      atomic.check(key, null),
      atomic.set(
        key,
        {
          input,
          target: captcha.target,
          createdAt,
        } satisfies ChallengeRecord,
        { expireIn: CHALLENGE_TTL_MS },
      ),
    ]);

    if (result.ok) {
      return {
        token,
        image: captcha.image,
        width: COMMENT_CAPTCHA_WIDTH,
        height: COMMENT_CAPTCHA_HEIGHT,
      };
    }
  }

  throw new Error("Unable to create a unique blog comment challenge");
}

export async function listBlogComments(
  postSlug: string,
  limit = 100,
): Promise<BlogComment[]> {
  const entries = await blogKv.list<BlogComment>(
    ["comments", postSlug],
    { limit, reverse: true },
  );
  return entries.flatMap((entry) => entry.value ? [entry.value] : []);
}

export async function publishBlogComment(
  postSlug: string,
  captcha: CommentCaptchaAnswer,
): Promise<PublishBlogCommentResult> {
  const challengeKey = ["comment-challenges", captcha.token] as const;
  const challenge = await blogKv.get<ChallengeRecord>(challengeKey);

  if (
    !challenge.value || !challenge.versionstamp ||
    challenge.value.input.postSlug !== postSlug
  ) {
    return { ok: false, reason: "expired" };
  }

  if (Date.now() - challenge.value.createdAt < MINIMUM_COMPLETION_MS) {
    await consumeChallenge(challengeKey, challenge.versionstamp);
    return {
      ok: false,
      reason: "too-fast",
      input: challenge.value.input,
    };
  }

  if (!matchesCommentCaptcha(captcha, challenge.value.target)) {
    await consumeChallenge(challengeKey, challenge.versionstamp);
    return {
      ok: false,
      reason: "incorrect",
      input: challenge.value.input,
    };
  }

  const id = createId();
  const comment: BlogComment = {
    ...challenge.value.input,
    id,
    createdAt: new Date().toISOString(),
  };
  const result = await blogKv.commit([
    atomic.check(challengeKey, challenge.versionstamp),
    atomic.delete(challengeKey),
    atomic.check(["comments", postSlug, id], null),
    atomic.set(["comments", postSlug, id], comment),
  ]);

  return result.ok ? { ok: true, comment } : { ok: false, reason: "conflict" };
}

async function consumeChallenge(
  key: readonly Deno.KvKeyPart[],
  versionstamp: string,
): Promise<void> {
  await blogKv.commit([
    atomic.check(key, versionstamp),
    atomic.delete(key),
  ]);
}
