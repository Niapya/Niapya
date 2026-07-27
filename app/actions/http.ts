import { COMMENT_FORM_MAX_BYTES } from "@/constants/http.ts";

export type FormRequestFailure = {
  reason: "same-origin" | "too-large" | "invalid-form";
  status: 400 | 403 | 413;
};

export type FormRequestResult =
  | { ok: true; formData: FormData }
  | ({ ok: false } & FormRequestFailure);

export function notFound(message = "Not Found"): Response {
  return new Response(message, { status: 404 });
}

export function noStore(status = 200): ResponseInit {
  return {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Content-Type-Options": "nosniff",
    },
  };
}

export async function parseFormRequest(
  request: Request,
  maxBytes = COMMENT_FORM_MAX_BYTES,
): Promise<FormRequestResult> {
  const origin = request.headers.get("origin");
  if (origin !== null && origin !== new URL(request.url).origin) {
    return { ok: false, reason: "same-origin", status: 403 };
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maxBytes) {
    return { ok: false, reason: "too-large", status: 413 };
  }

  try {
    return { ok: true, formData: await request.formData() };
  } catch {
    return { ok: false, reason: "invalid-form", status: 400 };
  }
}
