import assert from "node:assert/strict";

import { noStore, notFound, parseFormRequest } from "@/actions/http.ts";

Deno.test("parseFormRequest accepts a same-origin form", async () => {
  const request = new Request("https://niapya.example/comments", {
    method: "POST",
    headers: { origin: "https://niapya.example" },
    body: new URLSearchParams({ name: "Niapya" }),
  });

  const result = await parseFormRequest(request);

  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.formData.get("name"), "Niapya");
});

Deno.test("parseFormRequest rejects cross-origin forms", async () => {
  const request = new Request("https://niapya.example/comments", {
    method: "POST",
    headers: { origin: "https://elsewhere.example" },
    body: new URLSearchParams(),
  });

  assert.deepEqual(await parseFormRequest(request), {
    ok: false,
    reason: "same-origin",
    status: 403,
  });
});

Deno.test("parseFormRequest rejects oversized and invalid forms", async () => {
  const oversized = new Request("https://niapya.example/comments", {
    method: "POST",
    headers: { "content-length": "16385" },
    body: new URLSearchParams(),
  });
  const invalid = new Request("https://niapya.example/comments", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });

  assert.deepEqual(await parseFormRequest(oversized), {
    ok: false,
    reason: "too-large",
    status: 413,
  });
  assert.deepEqual(await parseFormRequest(invalid), {
    ok: false,
    reason: "invalid-form",
    status: 400,
  });
});

Deno.test("HTTP response helpers use the shared contract", async () => {
  const response = notFound();
  const init = noStore(429);
  const headers = new Headers(init.headers);

  assert.equal(response.status, 404);
  assert.equal(await response.text(), "Not Found");
  assert.equal(init.status, 429);
  assert.equal(headers.get("cache-control"), "no-store, max-age=0");
  assert.equal(headers.get("x-content-type-options"), "nosniff");
});
