import { COMMENT_FORM_MAX_BYTES } from "@/constants/http.ts";
import { log } from "@/lib/log.ts";

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
  const pathname = new URL(request.url).pathname;
  log.info("Form request received", {
    method: request.method,
    pathname,
  });

  const origin = request.headers.get("origin");
  if (origin !== null && origin !== new URL(request.url).origin) {
    log.warn("Form request rejected: invalid origin", { pathname });
    return { ok: false, reason: "same-origin", status: 403 };
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maxBytes) {
    log.warn("Form request rejected: payload too large", {
      pathname,
      contentLength,
    });
    return { ok: false, reason: "too-large", status: 413 };
  }

  try {
    const formData = await request.formData();
    log.debug("Form request parsed", { pathname });
    return { ok: true, formData };
  } catch {
    log.warn("Form request rejected: invalid form data", { pathname });
    return { ok: false, reason: "invalid-form", status: 400 };
  }
}
