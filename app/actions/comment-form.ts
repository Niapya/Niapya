import * as s from "remix/data-schema";
import { maxLength, minLength } from "remix/data-schema/checks";
import * as f from "remix/data-schema/form-data";

import type {
  CommentFormErrors,
  CommentFormValues,
} from "@/components/comments.tsx";

type CommentFormCopy = {
  errors: {
    captchaRequired: string;
    email: string;
    website: string;
  };
};

type CommentSchemaOptions = {
  contentRequired: boolean;
};

export function createCommentSchema(
  copy: CommentFormCopy,
  options: CommentSchemaOptions,
) {
  const trimmed = (maximum: number) =>
    s.defaulted(s.string(), "").transform((value) => value.trim()).pipe(
      maxLength(maximum),
    );
  const content = s.string().transform((value) => value.trim()).pipe(
    ...(options.contentRequired ? [minLength(1)] : []),
    maxLength(5_000),
  );

  return f.object({
    name: f.field(
      s.string().transform((value) => value.trim()).pipe(
        minLength(1),
        maxLength(60),
      ),
    ),
    email: f.field(
      trimmed(160).refine(
        (value) => value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        copy.errors.email,
      ),
    ),
    website: f.field(
      trimmed(300).refine(
        (value) => value === "" || isHttpUrl(value),
        copy.errors.website,
      ),
    ),
    location: f.field(trimmed(80)),
    content: f.field(content),
    captchaToken: f.field(s.string().pipe(minLength(36), maxLength(36))),
    "captcha.x": captchaCoordinate(copy),
    "captcha.y": captchaCoordinate(copy),
  });
}

export function readCommentFormValues(formData: FormData): CommentFormValues {
  return {
    name: textField(formData, "name"),
    email: textField(formData, "email"),
    website: textField(formData, "website"),
    location: textField(formData, "location"),
    content: textField(formData, "content"),
  };
}

export function commentIssuesToErrors(
  issues: readonly {
    message: string;
    path?: readonly (PropertyKey | { key: PropertyKey })[];
  }[],
): CommentFormErrors {
  const errors: CommentFormErrors = {};
  for (const issue of issues) {
    const key = getIssuePathKey(issue.path?.[0]);
    const errorKey = typeof key === "string" && key.startsWith("captcha.")
      ? "captcha"
      : key;
    if (typeof errorKey === "string" && !(errorKey in errors)) {
      errors[errorKey as keyof CommentFormErrors] = issue.message;
    }
  }
  return errors;
}

export function getIssuePathKey(
  segment: PropertyKey | { key: PropertyKey } | undefined,
): PropertyKey | undefined {
  return typeof segment === "object" && segment !== null
    ? segment.key
    : segment;
}

export function textField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function captchaCoordinate(copy: CommentFormCopy) {
  return f.field(
    s.string().transform((value) => value.trim()).refine(
      (value) => /^\d{1,3}$/.test(value),
      copy.errors.captchaRequired,
    ).transform(Number).refine(
      (value) => Number.isSafeInteger(value) && value >= 0 && value <= 999,
      copy.errors.captchaRequired,
    ),
  );
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
