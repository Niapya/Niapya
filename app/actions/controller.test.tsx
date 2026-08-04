import assert from "node:assert/strict";

import { router } from "@/router.ts";

function request(path: string): Request {
  return new Request(`http://niapya.test${path}`);
}

Deno.test("public HTML responses use browser and CDN cache policies", async () => {
  const response = await router.fetch(request("/?lang=en"));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "public, max-age=3600");
  assert.equal(
    response.headers.get("deno-cdn-cache-control"),
    "public, s-maxage=86400, stale-while-revalidate=86400",
  );
  assert.equal(response.headers.get("vary"), null);
});

Deno.test("HTML responses vary by Accept-Language without an explicit language", async () => {
  const response = await router.fetch(
    new Request("http://niapya.test/", {
      headers: { "Accept-Language": "zh-CN" },
    }),
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("vary"), "Accept-Language");
});

Deno.test("static assets use shared cache policy and validators", async () => {
  const response = await router.fetch(request("/assets/lunachat-preview.png"));

  assert.equal(response.status, 200);
  assert.equal(
    response.headers.get("cache-control"),
    "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
  );
  assert.ok(response.headers.get("etag"));
  assert.ok(response.headers.get("last-modified"));
});

Deno.test("language-dependent metadata responses vary by language", async () => {
  const response = await router.fetch(request("/rss.xml"));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "public, max-age=3600");
  assert.equal(
    response.headers.get("deno-cdn-cache-control"),
    "public, s-maxage=86400, stale-while-revalidate=86400",
  );
  assert.equal(response.headers.get("vary"), "Accept-Language");
});

Deno.test("OG images redirect unknown titles before rendering", async () => {
  const response = await router.fetch(
    request("/og-image.png?lang=en&title=untrusted-title"),
  );

  assert.equal(response.status, 302);
  assert.equal(
    response.headers.get("location"),
    "http://niapya.test/og-image.png?lang=en",
  );
});
