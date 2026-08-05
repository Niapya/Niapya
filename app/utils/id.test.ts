import assert from "node:assert/strict";

import { decodeTime } from "@std/ulid";

import { createDomId, createId } from "./id.ts";

Deno.test("createDomId uses the shared slug format", () => {
  assert.equal(
    createDomId("Cloud Filter", "Crème brûlée", 2),
    "cloud-filter-creme-brulee-2",
  );
});

Deno.test("unique identifiers preserve their intended formats", () => {
  const firstId = createId();
  const secondId = createId();

  assert.match(firstId, /^[0-9A-HJKMNP-TV-Z]{26}$/);
  assert.notEqual(firstId, secondId);
});

Deno.test("createId uses the seed time", () => {
  const seedTime = 1_700_000_000_000;

  assert.equal(decodeTime(createId(seedTime)), seedTime);
});
