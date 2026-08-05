# Pipeline: How A Class String Becomes CSS

## What This Covers

The compile chain inside `@twind/core` — parsing, variant/rule resolution, precedence, stable sorting, stringification, and the sheets — plus how this project's SSR streaming middleware drives that chain.

## The Compile Chain

Every class string flows through the same fixed sequence:

```
class string
  → parse()            tokenize + expand grouping syntax → ParsedRule[]
  → resolve variants   match prefix like `sm:`, `hover:`, `dark:`
  → resolve rules      first matching rule wins → CSS declaration object or alias
  → TwindRule          precedence (p), property precedence (o), ruleset (r)
  → sort               stable, predictable ordering
  → stringify()        CSS string into the sheet target
```

### 1. Parse

`parse(token)` splits a class string into `ParsedRule[]`. Each entry carries:

- `n` — the utility name
- `v` — the collected variants (e.g. `['hover', 'dark']`)
- `i` — the `!` important flag

Grouping syntax (`w-(full sm:auto)`, `hover:(...)`) is expanded here, before variant/rule resolution. Comments and whitespace are stripped.

### 2. Resolve variants

Each variant in `v` is resolved through the `variants` array against the selector/at-rule it maps to:

- default variants: `dark`, screen variants from the `screens` theme, and all simple pseudo-classes like `:hover`
- custom variants added by presets or `config.variants`

The output is an expanded ruleset, e.g. `hover:underline` → `&:hover` selector.

### 3. Resolve rules

The utility name is matched against `config.rules` in order — the **first matching rule with a result wins** (a falsy resolver result skips and tries the next rule). The resolver returns:

- a CSS declaration object → compiled directly
- a string of class names → an alias/shortcut, resolved recursively (so `~(...)`/`@(...)` and rule-based aliases expand into their constituent utilities)
- a falsy value → skip, try the next rule

Rule resolvers receive the match (`match[1..9]` groups, `match.$$`, `match.dark`) and a context object (`theme`, `e`, `h`, `d`, `v`, `r`, `s`, `f`).

### 4. TwindRule

Each successful resolution becomes a `TwindRule` with:

- `p` — precedence computed from all variants (dark flag, `@layer`, screens/responsive breakpoints, at-rules, pseudo-classes)
- `o` — property precedence (shorthand before longhand)
- `r` — the expanded ruleset: selectors and at-rules
- `d` — the stringified declarations
- `n` — the name used for `&` expansion

### 5. Stable sorting

Twind guarantees the same CSS output no matter the injection order. The sort keys, applied in order:

1. **dark** — dark-mode rules last (`last declaration wins` semantics are encoded into ordering)
2. **layer** — `@layer defaults → base → components → shortcuts → utilities → overrides`
3. **screens** — responsive breakpoint variants
4. **responsive** — extracted `min-width` value
5. **at-rules** — count of special chars (`-`, `:`, `,`) within the at-rule
6. **pseudo and group variants** — predictable pseudo-class order
7. **number of declarations** — single-declaration styles can override multi-declaration styles
8. **greatest property precedence** — shorthand before longhand (longhand overrides shorthand)
9. **name comparison** — final tie-break

### 6. Stringify into a sheet

`stringify(target)` renders the sorted rules into a CSS string for the sheet target (`virtual()` → `string[]`, `dom()`/`cssom()` → stylesheet elements).

## The Two Phases In This Project

### Setup (once, at module load)

`app/middleware/twind.ts` calls:

```ts
export const tw = install(twindConfig, IS_PRODUCTION);
```

`install` merges the presets (`presetAutoprefix`, `presetTailwind`, `presetTypography`) with the user config — resolving theme, rules, variants, preflight — into the `tw` instance. Because `IS_PRODUCTION` is passed, dev/prod behaviors (e.g. hashing) switch accordingly.

### Streaming compile (every HTML request)

The `twind()` middleware (registered in `app/router.ts`) wraps HTML responses in `TwindStream`, a `TransformStream`:

1. Incoming bytes are decoded and buffered (`state.push`).
2. At a flush point — a `<!-- rmx:flush ... -->` marker, the end of a `</template>`, or the end of `</html>` — the middleware:
   - snapshots global state, runs `consume(buffer, tw)` to push every `class` attribute in that HTML chunk through the compile chain, then restores state (`tw.snapshot()` guards)
   - renders the accumulated stylesheet with `stringify(tw.target)`
   - on the first flush, injects `<style data-twind>${css}</style>` right before `</head>`
   - on later flushes, diffs the CSS against the previous chunk (`fast-diff`) and emits a small inline script that patches the existing `style` element's `textContent`
3. Chunks pass through so the browser can start rendering while later HTML is still compiling.

Implications for app code:

- **Any `class` attribute in the final HTML is compiled automatically.** Write plain class strings; never call `tw()`/`tx()` per element.
- Classes that never appear in serialized HTML (only in JS strings) would not be compiled. This project is pure SSR, so all styling lives in markup.
- Because `consume` handles the whole HTML string, utilities inside `class` on any element — including dynamically-generated markup like markdown output — are picked up.
- Changes to `twindConfig` (new rules, tokens) apply on the next request with no extra wiring.

## Reference

Source modules in the cloned repo: `packages/core/src/parse.ts` (parse), `packages/core/src/runtime.ts` (resolve + sort), `packages/core/src/twind.ts` (instance), `packages/core/src/sheets.ts` (sheets + stringify), `packages/core/src/ssr.ts` (inline/extract/consume).
