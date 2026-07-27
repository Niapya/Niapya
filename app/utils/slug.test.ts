import assert from "node:assert/strict";

import { createUniqueSlugger, slug } from "./slug.ts";

Deno.test("slug normalizes words and punctuation", () => {
  assert.equal(slug("  Remix 3: Server-First!  "), "remix-3-server-first");
  assert.equal(slug("Crème brûlée's Notes"), "creme-brulees-notes");
});

Deno.test("slug preserves Unicode letters and numbers", () => {
  assert.equal(slug("你好，Remix 3"), "你好-remix-3");
});

Deno.test("slug returns an empty string when no slug characters remain", () => {
  assert.equal(slug("---"), "");
});

Deno.test("createUniqueSlugger uses the shared slug rules and stable suffixes", () => {
  const uniqueSlug = createUniqueSlugger("section");

  assert.equal(uniqueSlug("Crème brûlée"), "creme-brulee");
  assert.equal(uniqueSlug("Crème brûlée"), "creme-brulee-1");
  assert.equal(uniqueSlug("Crème brûlée"), "creme-brulee-2");
  assert.equal(uniqueSlug("---"), "section");
  assert.equal(uniqueSlug("---"), "section-1");
});

Deno.test("createUniqueSlugger avoids collisions with explicit suffixes", () => {
  const uniqueSlug = createUniqueSlugger();

  assert.equal(uniqueSlug("Foo"), "foo");
  assert.equal(uniqueSlug("Foo 1"), "foo-1");
  assert.equal(uniqueSlug("Foo"), "foo-2");
});
