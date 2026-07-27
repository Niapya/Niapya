import assert from "node:assert/strict";

import { cn } from "./cn.ts";

Deno.test("cn joins conditional classes and resolves Tailwind conflicts", () => {
  assert.equal(
    cn(
      "flex px-2",
      ["items-center", false],
      { hidden: false, block: true },
      "px-4",
    ),
    "items-center block px-4",
  );
});

Deno.test("cn ignores empty class values", () => {
  assert.equal(cn(undefined, null, false, "", "text-sm"), "text-sm");
});
