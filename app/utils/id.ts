import { ulid } from "@std/ulid";

import { slug } from "./slug.ts";

/** Creates a sortable identifier for persisted records. */
export function createUniqueId(): string {
  return ulid();
}

/** Creates a sortable token for short-lived challenges. */
export function createUniqueToken(): string {
  return ulid();
}

/** Creates a deterministic DOM-safe identifier from semantic parts. */
export function createDomId(...parts: readonly (string | number)[]): string {
  const id = slug(parts.join("-"));
  if (!id) throw new TypeError("A DOM identifier needs at least one word");
  return id;
}
