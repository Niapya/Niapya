import process from "node:process";

import type { Lang } from "@/i18n/index.ts";
import { createUniqueId, createUniqueToken } from "@/utils/id.ts";
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

const commentsKv = createKvFeature("comments");
const CHALLENGE_TTL_MS = 10 * 60 * 1000;
const MINIMUM_COMPLETION_MS = process.env.NODE_ENV === "test" ? 0 : 1_500;

type ChallengeRecord = {
  input: NewComment;
  target: CommentCaptchaTarget;
  createdAt: number;
};

export type Comment = {
  id: string;
  name: string;
  email: string;
  website: string;
  location: string;
  content: string;
  createdAt: string;
};

export type NewComment = Omit<Comment, "id" | "createdAt">;

export type CaptchaChallenge = CommentCaptchaChallenge;

export type PublishCommentResult =
  | { ok: true; comment: Comment }
  | { ok: false; reason: "expired" | "conflict" }
  | { ok: false; reason: "incorrect" | "too-fast"; input: NewComment };

export async function createCaptchaChallenge(
  input: NewComment,
  lang: Lang,
): Promise<CaptchaChallenge> {
  // KV keeps the pending draft available across short-lived server instances.
  for (let attempt = 0; attempt < 3; attempt++) {
    const createdAt = Date.now();
    const captcha = await generateCommentCaptcha(
      createdAt + CHALLENGE_TTL_MS,
      lang,
    );
    const token = createUniqueToken();
    const key = ["challenges", token] as const;
    const result = await commentsKv.commit([
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

  throw new Error("Unable to create a unique comments challenge");
}

export async function listComments(limit = 50): Promise<Comment[]> {
  const entries = await commentsKv.list<Comment>(["entries"], {
    limit,
    reverse: true,
  });
  return entries.flatMap((entry) => entry.value ? [entry.value] : []);
}

export async function publishComment(
  captcha: CommentCaptchaAnswer,
): Promise<PublishCommentResult> {
  const challengeKey = ["challenges", captcha.token] as const;
  const challenge = await commentsKv.get<ChallengeRecord>(challengeKey);

  if (!challenge.value || !challenge.versionstamp) {
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

  const id = createUniqueId();
  const comment: Comment = {
    ...challenge.value.input,
    id,
    createdAt: new Date().toISOString(),
  };
  const result = await commentsKv.commit([
    atomic.check(challengeKey, challenge.versionstamp),
    atomic.delete(challengeKey),
    atomic.check(["entries", id], null),
    atomic.set(["entries", id], comment),
  ]);

  return result.ok ? { ok: true, comment } : { ok: false, reason: "conflict" };
}

async function consumeChallenge(
  key: KvFeatureKey,
  versionstamp: string,
): Promise<void> {
  await commentsKv.commit([
    atomic.check(key, versionstamp),
    atomic.delete(key),
  ]);
}

type KvFeatureKey = readonly Deno.KvKeyPart[];
