# Presets And Plugins

## What This Covers

Twind's plugin system: what a preset is, every official preset and what it provides, their options, and which ones this project installs. Framework integration packages are out of scope for this project.

## What A Preset Is

A preset is a plain config fragment that gets merged into the twind config. It may contribute:

- `rules` — new utilities
- `variants` — new state/context selectors
- `theme` — theme sections (colors, spacing, …)
- `preflight` — base/reset styles
- `darkMode`, `darkColor`, `hash`, `stringify`, `ignorelist`, `finalize`

Presets are functions returning a config object and are composed via `presets: [presetA(), presetB()]` in `defineConfig`. This is the entire "plugin" concept — there is no separate plugin API. Because presets are just config, writing a custom preset is identical to writing `rules`/`variants`/`theme` directly.

## Official Presets

All are npm packages prefixed `@twind/preset-`, installable with `deno i npm:@twind/preset-<name>`.

### @twind/preset-tailwind — Tailwind v3 foundation

The full Tailwind CSS v3 experience: every utility, every variant, and the preflight reset. This is the base preset for any real project.

```ts
presetTailwind({
  disablePreflight: false, // set true to skip the Tailwind preflight
  colors: { /* selectively override colors to shrink the bundle */ },
});
```

Advanced: `@twind/preset-tailwind/base` omits the default Tailwind color palette; individual palettes come from `@twind/preset-tailwind/colors` (e.g. `slate`, `red`, `amber`, `emerald`, `indigo`). This project uses the full preset.

### @twind/preset-autoprefix — vendor prefixes

A CSS vendor prefixer and property alias mapper, e.g. it adds `-webkit-`/`-moz-` prefixes and maps camelCase to the correct prefixed property names. No options. Installed in this project.

### @twind/preset-typography — prose

A `prose` component class (plus `prose-sm/md/lg/xl/2xl`, `prose-invert`, modifiers) that applies typographic defaults to vanilla HTML you do not control — markdown, CMS output. This project installs it for blog/markdown pages.

```ts
presetTypography({
  defaultColor: "brand",
  colors: { body: "11", headings: "12", links: "12", code: "11", /* … */ },
});
```

### @twind/preset-ext — extra utilities and variants

Utilities and variants not yet part of Tailwind:

- **Short CSS**: any property as a class, `background-color[#1da1f1]` → `background-color: #1da1f1`. Underscores become spaces (`m-[1.5rem_0]`).
- Variants: `hocus:` (`&:hover,&:focus-visible`), `group-hocus:`, `children:` (`&>*`), `siblings:` (`&~*`), `sibling:` (`&+*`), `override:` (`&&` — raise specificity).

### @twind/preset-line-clamp — line truncation

`line-clamp-{n}` utilities that visually truncate text to `n` lines (with the `-webkit-box` fallbacks). Based on `@tailwindcss/line-clamp`.

### @twind/preset-container-queries — container queries

Container-query utilities backed by a `containers` theme section: `@container`, `@xs:`…`@7xl:`, and named-container variants. Based on `@tailwindcss/container-queries`.

### @twind/preset-radix-ui — Radix UI colors

The 12-step Radix UI color scales as theme colors plus an auto-dark color function. Colors-only preset (no rules/variants). Useful with `@twind/preset-tailwind/base` to compose a semantic palette.

### @twind/preset-tailwind-forms — form reset

A basic reset for form elements so native inputs are easy to restyle with utilities. Based on `@tailwindcss/forms`.

## Not Relevant Here

- `@twind/cdn` — a browser `<script>` bundle with tailwind + autoprefix preinstalled. This project is pure SSR; the streaming middleware replaces it.
- `@twind/with-react`, `@twind/with-remix`, `@twind/with-next`, `@twind/with-gatsby`, `@twind/with-sveltekit`, `@twind/with-web-components` — framework integration packages. This project wires Twind itself via `app/middleware/twind.ts`, so none are used.

## This Project's Presets

`app/middleware/twind.ts`:

```ts
const twindConfig = {
  presets: [presetAutoprefix(), presetTailwind(), presetTypography()],
  darkMode: "media",
  preflight: [themeVariables],
  theme: { extend: { /* tokens */ } },
};
```

| Preset | Role in this project |
| ------ | -------------------- |
| `presetTailwind()` | All utilities and variants used across the app |
| `presetAutoprefix()` | Vendor-prefixed CSS for browser compat |
| `presetTypography()` | `prose` styling for markdown-derived blog content |
| `preflight: [themeVariables]` | Custom base styles: CSS-variable tokens (`:root`/`.dark`), view-transition + scrollbar styles, `body` defaults. Replaces/augments the Tailwind preflight. |

To add another preset: `deno i npm:@twind/preset-<name>`, import it, and append to the `presets` array. If the preset needs theme keys, extend them in `theme.extend`.
