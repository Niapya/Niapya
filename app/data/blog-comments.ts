import process from "node:process";

import type { Lang } from "@/i18n/index.ts";
import { createUniqueId, createUniqueToken } from "@/utils/id.ts";
import { atomic, createKvFeature } from "./kv.ts";
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
const MINIMUM_COMPLETION_MS = process.env.NODE_ENV === "test" ? 0 : 1_500;

type ChallengeRecord = {
  postSlug: string;
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
  | {
    ok: false;
    reason: "expired" | "incorrect" | "too-fast" | "conflict";
  };

export async function createBlogCommentChallenge(
  postSlug: string,
  lang: Lang,
): Promise<BlogCommentChallenge> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const createdAt = Date.now();
    const captcha = await generateCommentCaptcha(
      createdAt + CHALLENGE_TTL_MS,
      lang,
    );
    const token = createUniqueToken();
    const key = ["comment-challenges", token] as const;
    const result = await blogKv.commit([
      atomic.check(key, null),
      atomic.set(
        key,
        {
          postSlug,
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
  input: NewBlogComment,
  captcha: CommentCaptchaAnswer,
): Promise<PublishBlogCommentResult> {
  const challengeKey = ["comment-challenges", captcha.token] as const;
  const challenge = await blogKv.get<ChallengeRecord>(challengeKey);

  if (
    !challenge.value || !challenge.versionstamp ||
    challenge.value.postSlug !== input.postSlug
  ) {
    return { ok: false, reason: "expired" };
  }

  if (Date.now() - challenge.value.createdAt < MINIMUM_COMPLETION_MS) {
    await consumeChallenge(challengeKey, challenge.versionstamp);
    return { ok: false, reason: "too-fast" };
  }

  if (!matchesCommentCaptcha(captcha, challenge.value.target)) {
    await consumeChallenge(challengeKey, challenge.versionstamp);
    return { ok: false, reason: "incorrect" };
  }

  const id = createUniqueId();
  const comment: BlogComment = {
    ...input,
    id,
    createdAt: new Date().toISOString(),
  };
  const result = await blogKv.commit([
    atomic.check(challengeKey, challenge.versionstamp),
    atomic.delete(challengeKey),
    atomic.check(["comments", input.postSlug, id], null),
    atomic.set(["comments", input.postSlug, id], comment),
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
