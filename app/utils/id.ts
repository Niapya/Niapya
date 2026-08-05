import { ulid } from "@std/ulid";

import { slug } from "./slug.ts";

/** Creates a sortable identifier for persisted records. */
export function createId(seed?: number): string {
  return ulid(seed);
}

/** Creates a deterministic DOM-safe identifier from semantic parts. */
export function createDomId(...parts: readonly (string | number)[]): string {
  const id = slug(parts.join("-"));
  if (!id) throw new TypeError("A DOM identifier needs at least one word");
  return id;
}
