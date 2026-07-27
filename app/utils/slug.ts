export function slug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLocaleLowerCase("en-US")
    .replace(/['\u2019]/gu, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/gu, "");
}

/** Creates stable, collision-free slugs within one document namespace. */
export function createUniqueSlugger(fallback = "item") {
  const used = new Set<string>();
  const suffixes = new Map<string, number>();

  return (value: string): string => {
    const base = slug(value) || slug(fallback) || "item";
    let suffix = suffixes.get(base) ?? 0;
    let candidate = suffix === 0 ? base : `${base}-${suffix}`;

    while (used.has(candidate)) {
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }

    suffixes.set(base, suffix);
    used.add(candidate);
    return candidate;
  };
}
