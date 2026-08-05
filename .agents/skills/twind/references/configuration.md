# Configuration

## What This Covers

`defineConfig`, presets, theme extension, custom `rules`, custom `variants`, `darkMode`, hashing, and `@layer`/`@apply`/`theme()` inside custom styles.

## defineConfig And Presets

`@twind/core` provides `defineConfig` for type inference. All utilities come from presets — the core package ships none.

```ts
import { defineConfig } from "@twind/core";
import presetAutoprefix from "@twind/preset-autoprefix";
import presetTailwind from "@twind/preset-tailwind";
import presetTypography from "@twind/preset-typography";

export default defineConfig({
  presets: [presetAutoprefix(), presetTailwind(), presetTypography()],
  darkMode: "media",
  theme: { extend: { /* … */ } },
});
```

In this project the config object lives inline in `app/middleware/twind.ts` and is passed to `install(twindConfig, IS_PRODUCTION)`. `theme.extend` merges into the Tailwind theme; putting keys at `theme` root replaces it.

## Theme

`theme` mirrors the Tailwind CSS theme. The project extends `colors`, `borderRadius`, `fontFamily`, `spacing`, `maxWidth`, and `boxShadow`.

```ts
theme: {
  extend: {
    colors: {
      primary: { DEFAULT: "var(--primary)", foreground: "var(--primary-foreground)" },
    },
    fontFamily: {
      sans: ["var(--font-sans)"],
      display: ["var(--font-display)"],
    },
    spacing: { 18: "4.5rem" },
    maxWidth: { "8xl": "90rem" },
  },
},
```

`theme(...)` accesses values at runtime, including in arbitrary values: `bg-[theme(colors.primary.DEFAULT)]`, and `tw.theme('colors.blue.500', 'blue')` reads a section/dotted key with an optional default.

## Custom Rules

`rules` is an ordered array of `[pattern, resolver]`. The first matching rule with a result wins. Patterns are regex-like strings compiled with `new RegExp`:

- treated as starts-with (`^` prefix)
- ends with `-` or contains `$` → remainder is available as `$$`
- otherwise treated as ends-with (`$` suffix)

Resolver receives the match (`match[1..9]` groups, `match.$$`, `match.dark`) and a context with `theme`, and returns a declaration object, a falsy value (skip), or a string of class names.

```ts
rules: [
  // Static declaration
  ["hidden", { display: "none" }],

  // Static property rule
  ["table-(auto|fixed)", "tableLayout"],

  // Dynamic declaration
  ["m-(\\d+)", (match) => ({ margin: `${match[1] / 4}rem` })],

  // Static alias
  ["card", "py-2 px-4 font-semibold rounded-lg shadow-md"],

  // Dynamic alias — `$$` is everything after the matched prefix
  ["card-", ({ $$ }) => `bg-${$$}-400 text-${$$}-100 py-2 px-4 rounded-lg`],

  // Single-utility alias (must use `~(...)`)
  ["red", "~(text-red-100)"],

  // Apply alias — styles emitted in declared order
  ["btn-green", "@(bg-green-500 hover:bg-green-700 text-white)"],
],
```

`css` and `style` helpers can also back a rule:

```ts
rules: [
  ["target-new-tab", css`target-name: new; target-new: tab;`],
  [
    "box\\?(.+)",
    style({
      props: {
        color: { coral: css({ backgroundColor: "coral" }), purple: css`background-color: purple;` },
        rounded: { "": "rounded", md: "rounded-md" },
      },
    }),
  ],
],
```

## Custom Variants

`variants` maps a variant name to a selector or at-rule. Built-in defaults include `dark`, screen variants from `screens`, and all simple pseudo-classes.

```ts
variants: [
  // Static
  ["print", "@media print"],
  ["odd", "&:nth-child(odd)"],
  ["open", "&[open]"],

  // Dynamic
  ["(ltr|rtl)", ({ 1: $1 }) => `[dir="${$1}"] &`],
],
```

## Dark Mode

```ts
darkMode: "media",            // @media (prefers-color-scheme: dark)
darkMode: "class",            // `.dark`
darkMode: ".dark-mode",
darkMode: "[theme=dark]",
```

This project uses `"media"`. `darkColor` (e.g. `autoDarkColor`) can generate automatic dark colors from Tailwind palettes when no explicit `dark:` variant is present.

## @layer, @apply, @screen In Custom Styles

Inside `css()` or `injectGlobal`, Twind supports the Tailwind directives:

- `@layer defaults|base|components|shortcuts|utilities|overrides` — order matters (defaults first, overrides last)
- `@apply` — inline existing utilities
- `@media screen(...)` — reference breakpoints by name

```ts
injectGlobal`
  @layer base {
    body { margin: 0; }
  }
`;
```

## Hashing Class Names

`hash(className, defaultHash)` controls class name output. This project does not hash. Example to hash only aliases:

```ts
hash(className, defaultHash) {
  return /^[~@]\(/.test(className) ? defaultHash(className) : className;
}
```
