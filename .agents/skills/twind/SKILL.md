---
name: twind
description: Style Deno + Remix 3 UI with Twind v1 (`@twind/core`). Use when writing or reviewing Tailwind-style utility classes in `class` attributes, extending the twind theme or config, adding custom rules or variants, creating shortcut/apply aliases, or touching the twind SSR streaming middleware in `app/middleware/twind.ts`.
---

# Style UI with Twind

Use this skill for any styling work in this project. Twind compiles Tailwind v3 utility classes to CSS at runtime — here fully on the server, no build step and no client JavaScript. This skill documents the pipeline (how a class string becomes CSS), the preset/plugin system, the full `@twind/core` API and its utility functions, and the project-specific wiring.

## What Twind Is

- Twind v1 is a runtime CSS compiler with feature parity with Tailwind CSS v3: same utility names, variants, arbitrary values, and `!` important modifier.
- `@twind/core` ships **no utilities**. All utilities come from presets — the plugin system below.
- Two usage modes: *shim mode* (observe the DOM and inject styles into the page) and *library mode* (a programmatic `tw` instance). This project uses Twind **server-side only** and streams the generated CSS into the HTML.
- Generated CSS is atomic, deduplicated, and sorted in a stable, predictable order regardless of the order classes appear.

## The Pipeline

Twind turns a class string into CSS in a fixed chain. Every utility in the project flows through it.

```
class string (HTML `class` attr)
  │
  ▼
parse()        tokenize + expand grouping syntax → names + variants + `!` flag
  │
  ▼
resolve        match each name against variants[] then rules[] (first match wins)
  │             rule resolver → CSS declaration object (or alias string, resolved recursively)
  │
  ▼
TwindRule      p = precedence (dark/layer/screens/at-rules/pseudo), o = property precedence,
  │             r = expanded ruleset (selectors + at-rules)
  │
  ▼
sort           stable ordering: layer → screens → at-rules → pseudo → decl count
  │             → shorthand-before-longhand → name
  │
  ▼
stringify()    render sorted TwindRules → CSS string into the sheet target
```

Two phases happen once per request in this project:

1. **Setup** — `install(twindConfig, IS_PRODUCTION)` merges presets + user config into a `tw` instance. Done once at module load in `app/middleware/twind.ts`.
2. **Streaming compile** — the `twind()` middleware runs `consume()` over the serialized HTML chunks, which pushes every `class` attribute through the pipeline above, then `stringify()` collects the CSS and injects `<style data-twind>` into `<head>` (with diff patches for later stream chunks).

Full detail, including how precedence/ordering is computed and how the streaming middleware works: `references/pipeline.md`.

## The Plugin System (Presets)

In Twind a *preset* is a packaged chunk of configuration: it can add `rules`, `variants`, theme, `preflight`, and other config. This is the plugin system — there is no other "plugin" concept. Presets are npm packages prefixed `@twind/preset-*` and are wired in via the `presets` array.

### Official presets

| Preset | What it provides |
| ------ | ---------------- |
| `@twind/preset-tailwind` | The full Tailwind CSS v3 experience: every Tailwind utility, variant, and the preflight. The foundation preset. |
| `@twind/preset-autoprefix` | CSS vendor prefixer + property alias mapper (e.g. maps `userSelect` to `-webkit-user-select`). |
| `@twind/preset-typography` | `prose` classes for beautiful typographic defaults on vanilla HTML (markdown/CMS output). |
| `@twind/preset-ext` | Extra utilities/variants not yet in Tailwind: short CSS syntax `background-color[#1da1f1]`, and variants `hocus`, `children`, `siblings`, `sibling`, `override`. |
| `@twind/preset-line-clamp` | `line-clamp-{n}` utilities to truncate text to `n` lines. |
| `@twind/preset-container-queries` | Container-query utilities (`@container`, `@md:` …) backed by a `containers` theme section. |
| `@twind/preset-radix-ui` | Radix UI color scales with automatic dark colors; colors-only preset (no rules/variants). |
| `@twind/preset-tailwind-forms` | Form-element reset so native inputs are easy to style with utilities. |

There is also `@twind/cdn` (browser script with tailwind + autoprefix preinstalled) and framework integration packages (`@twind/with-*`) — **not relevant here**. This project is pure SSR, so only the three presets below are installed.

### What this project uses

`app/middleware/twind.ts` installs:

```ts
presets: [presetAutoprefix(), presetTailwind(), presetTypography()],
darkMode: "media",
preflight: [themeVariables],
```

- `presetTailwind()` — all utilities/variants + preflight
- `presetAutoprefix()` — automatic vendor prefixes
- `presetTypography()` — `prose` styling for blog/markdown content
- `preflight: [themeVariables]` — a custom `CSSBase` object overriding the reset with CSS-variable tokens, view-transition and scrollbar styles

Adding another preset means `deno i npm:@twind/preset-<name>` and appending it to `presets`. Full details and options: `references/presets-and-plugins.md`.

## The `@twind/core` API

Everything below is exported from `@twind/core` (referenced in this project as `npm:@twind/core` in `deno.json`). The full inventory with signatures and examples is in `references/api-reference.md`.

### Instance creation

| Function | Purpose |
| -------- | ------- |
| `install(config, isProduction?)` | Create a `tw` instance, register it as the global, observe DOM (shim). This project uses it server-side. |
| `setup(config, sheet?, target?)` | Create + register a `tw` instance with an explicit sheet. |
| `twind(config, sheet)` | Create a standalone `tw` instance without touching the global (library mode). |
| `defineConfig(config)` | Typed helper for writing a config/preset object. |

### The `tw` instance

| Member | Purpose |
| ------ | ------- |
| `tw(tokens)` | Compile a class string, inject the styles, return processed class names. |
| `tw.config` | The active config. |
| `tw.theme(...)` | Read theme values (`tw.theme()`, `tw.theme(section)`, `tw.theme(dottedKey, default)`). |
| `tw.target` | The sheet target (CSS string array, etc.). |
| `tw.snapshot()` | Return a restore function — the SSR state guard. |
| `tw.clear()` / `tw.destroy()` | Clear rules / remove the sheet. |

### Utility functions (string and style helpers)

| Function | Purpose | Injects? |
| -------- | ------- | -------- |
| `cx(...args)` | Build a class string from args/template (conditional, grouping, comments). | no |
| `tx(...args)` | `tw(cx(...))` — build and inject in one step. | yes |
| `css(...args)` | CSS object/template → class name. | no |
| `shortcut(...args)` | Named/anonymous `~(...)` alias builder. | no |
| `apply(...args)` | Named/anonymous `@(...)` alias builder. | no |
| `injectGlobal(...args)` | Inject styles into the `base` layer (resets, global rules). | yes |
| `keyframes(...)` / `keyframes.Name(...)` | Lazy-inject keyframes, return a unique name. | yes |
| `animation(...)` / `animation.Name(...)` | Lazy-inject an animation shorthand + keyframes. | yes |
| `style(options)` | Stitches-like variant helper returning a `style(props)` fn. | no |
| `parse(token)` | Parse a class string into `ParsedRule[]` (names + variants + important). | — |
| `observe(tw, target?)` / `mo(tw?)` | DOM observation (shim). | — |
| `withAutocomplete(...)`, `getAutocompleteProvider(...)` | Autocomplete providers for editors. | — |

### Config/rules/variants helpers

`match(...)`, `fromMatch(...)`, `matchTheme(...)`, `fromTheme(...)`, `matchColor(...)`, `colorFromTheme(...)`, `parseValue(...)`, `toCSS(...)`, `arbitrary(...)`, `normalize(...)`, `toColorValue(...)`, `autoDarkColor(...)` — resolver builders and color/arbitrary-value utilities used inside custom rules. See `references/api-reference.md`.

### Sheets and SSR

| Function | Purpose |
| -------- | ------- |
| `getSheet(useDOMSheet?, disableResume?)` | Environment-appropriate sheet. |
| `virtual(...)` / `cssom(...)` / `dom(...)` | Sheet factories: array / fast / debug DOM sheets. |
| `stringify(target)` | Render a sheet target to a CSS string. |
| `inline(html, tw?)` | Update class attributes in HTML and inject a `<style>` into `<head>`. |
| `extract(html, tw?)` | Return updated HTML plus the CSS separately. |
| `consume(html, tw?)` | Update class attributes and inject all styles into `tw`. **The function this project's middleware uses.** |

### Utils

`hash(value)`, `escape(value)`, `mql(screen, prefix?)`, `asArray(value)`, `identity(value)`, `noop()`.

## When To Use This Skill

Use it for:

- writing or reviewing `class` strings in Remix components
- adding or changing theme tokens (colors, fonts, spacing, radii, shadows)
- adding custom utilities (`rules`) or custom variants
- bundling repeated utility groups (`shortcut`/`apply` aliases)
- modifying `app/middleware/twind.ts` or how styles stream into HTML
- choosing between a Tailwind class, the `css()` mixin, or a config rule for a given style need

## Load Only The References You Need

Classify the task first, then load the smallest useful reference set. Each reference starts with a "What This Covers" section — read that first before reading the rest.

| Task involves...                                                          | Start with                                  |
| ------------------------------------------------------------------------- | ------------------------------------------- |
| How a class string becomes CSS, ordering, the SSR streaming middleware    | `references/pipeline.md`                    |
| Full API inventory with signatures and examples                          | `references/api-reference.md`               |
| All official presets, their options, what to install when                | `references/presets-and-plugins.md`         |
| Writing class strings, grouping syntax, variants, arbitrary values        | `references/utilities-and-syntax.md`        |
| Theme, presets, custom rules, custom variants, darkMode, hashing          | `references/configuration.md`               |
| Reusable style bundles via `~(...)`/`@(...)` aliases                      | `references/aliases-and-component-styles.md`|
| This project's twind wiring, conventions, and mistakes                    | `references/project-integration.md`         |

## Project Style Conventions

These rules from `AGENTS.md` govern how class strings are written:

- Reuse semantic tokens (`text-foreground`, `bg-background`, `border-border`). The theme maps them to CSS variables that switch with light/dark mode.
- Prefer Tailwind's preset integer utilities. Use one-digit values as needed; for two-digit values prefer multiples of five (e.g. `p-10`, `p-15`). Avoid arbitrary `[...]` classes and `px` units unless a standard utility cannot express the value.
- For effects, prefer CSS animations and transitions via utility classes (`transition-*`, `duration-*`, `ease-*`) over JavaScript.
- When Tailwind cannot express a value (`clamp`, `minmax`, percentages, non-standard values), write a local `css()` mixin next to the component — do not use inline `style`.
- In local `css()` mixins, use `rem`, `em`, percentages, or viewport units.

## Common Mistakes To Avoid

- Importing from `twind` or a top-level entry instead of `@twind/core` (this project uses `npm:@twind/core` via `deno.json`).
- Assuming `@twind/core` alone provides utilities — presets provide them.
- Calling `tw()` per element when a plain `class` string suffices (the streaming middleware already compiles class attributes from HTML).
- Using React's `className` — Remix 3 components use `class`.
- Spreading twind config across files; the config lives in `app/middleware/twind.ts`.
- Reaching for `style={{ ... }}` when a utility class or a local `css()` mixin exists.
- Adding client-side JavaScript to implement an effect that CSS transitions/animations can handle.
- Duplicating a style need that already has a config alias/rule instead of reusing it.
- Installing framework-integration packages (`@twind/with-*`) — this project does its own SSR streaming.
