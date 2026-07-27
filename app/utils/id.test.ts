import assert from "node:assert/strict";

import { createDomId, createUniqueId, createUniqueToken } from "./id.ts";

Deno.test("createDomId uses the shared slug format", () => {
  assert.equal(
    createDomId("Cloud Filter", "Crème brûlée", 2),
    "cloud-filter-creme-brulee-2",
  );
});

Deno.test("unique identifiers preserve their intended formats", () => {
  const firstId = createUniqueId();
  const secondId = createUniqueId();
  const firstToken = createUniqueToken();
  const secondToken = createUniqueToken();

  assert.match(firstId, /^[0-9A-HJKMNP-TV-Z]{26}$/);
  assert.notEqual(firstId, secondId);
  assert.match(firstToken, /^[0-9A-HJKMNP-TV-Z]{26}$/);
  assert.notEqual(firstToken, secondToken);
});
