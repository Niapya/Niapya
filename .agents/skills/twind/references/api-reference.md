# API Reference

## What This Covers

The complete `@twind/core` export surface: instance creation, the `tw` instance, utility (helper) functions, config/rules/variants helpers, sheets, SSR helpers, DOM observation, and autocomplete. Grouped so you can scan quickly; signatures reflect the v1 API.

## Instance Creation

| API | Signature | Purpose |
| --- | --------- | ------- |
| `install` | `install(config?, isProduction?) → Twind` | Build a `tw` instance, register it as the global `tw`, and observe the DOM (shim mode). The instance returned is used server-side in this project. |
| `setup` | `setup(config?, sheet?, target?) → Twind` | Build + register the global `tw` with an explicit sheet. |
| `twind` | `twind(config, sheet) → Twind` | Standalone instance, no global side effects (library mode). |
| `defineConfig` | `defineConfig(config) → TwindUserConfig` | Typed config object for `install`/`setup`/`twind` and presets. |

## The `tw` Instance

| Member | Signature | Purpose |
| ------ | --------- | ------- |
| call | `tw(tokens) → string` | Compile a class string, inject styles, return processed class names. |
| `config` | `tw.config → TwindConfig` | Active config. |
| `theme` | `tw.theme() / (section) / (dottedKey, default?) → theme value` | Read theme values. |
| `target` | `tw.target` | Sheet target (`string[]`, stylesheet element). |
| `snapshot` | `tw.snapshot() → RestoreSnapshot` | Return a restore fn for the current sheet state — the SSR guard used by the middleware. |
| `clear` | `tw.clear() → void` | Clear all rules from the sheet. |
| `destroy` | `tw.destroy() → void` | Remove the sheet from the document. |

## Utility Functions

### String and class helpers

| Function | Signature | Injects styles? | Notes |
| -------- | --------- | --------------- | ----- |
| `cx` | `cx(...args) / cx\`...\` → string` | no | Build a class string; supports conditionals, grouping, comments. |
| `tx` | `tx(...args) / tx\`...\` → string` | yes | Equivalent to `tw(cx(...))`. |
| `css` | `css(object) / css\`...\` → string` | no | CSS object/template literal → class name. Backs rules and mixins. |
| `shortcut` | `shortcut(...) / shortcut.Name(...) → string` | no | Build a `~(...)` alias class (must be used in a class string or `tw`). |
| `apply` | `apply(...) / apply.Name(...) → string` | no | Build an `@(...)` alias class (declared-order semantics). |

> In this project's components, host-element mixins use `css` from `remix/ui`. `@twind/core`'s `css` is for config rules and alias/style bundles.

### Global style helpers

| Function | Signature | Purpose |
| -------- | --------- | ------- |
| `injectGlobal` | `injectGlobal\`...\` / (object) → void` | Inject styles into the `base` layer (resets, element styles). Supports `@font-face`, `@layer`, `@apply`. |
| `keyframes` | `keyframes\`...\` / keyframes(object) / keyframes.Name(...) → string` | Lazily inject keyframes, return a unique name usable in arbitrary values and `css`. |
| `animation` | `animation(shorthand, waypoints) / animation.Name(...) → string` | Lazily inject a named animation from a shorthand + keyframes. |
| `style` | `style(options) → style(props)` | Stitches-like variant builder for component styles; returns a class name per prop set. |

### Parsing

| Function | Signature | Purpose |
| -------- | --------- | ------- |
| `parse` | `parse(token) → ParsedRule[]` | Split a class string into `{ n, v, i }` entries (name, variants, important). |

## Config, Rules And Variants Helpers

These build resolvers for custom `rules`/`variants` in config.

| Function | Purpose |
| -------- | ------- |
| `match(pattern, resolve)` | Rule resolver helper that matches a pattern and produces declarations from theme values. |
| `fromMatch(pattern?, resolve?)` | Rule resolver factory bound to theme sections. |
| `matchTheme(section, resolve)` | Match against a theme section and resolve with the matched key. |
| `fromTheme(section)` | Resolver that produces declarations from a theme section. |
| `matchColor(...)`, `colorFromTheme(...)` | Color-specialized match/resolve helpers (opacity, alpha). |
| `parseValue(...)` | Parse a utility value string. |
| `toCSS(property, value)` | Build a CSS declaration object from a property + value (handles `var()`, color functions). |
| `arbitrary(value, property, context)` | Resolve an arbitrary `[...]` value to a CSS value. |
| `normalize(value)` | Normalize a value string. |
| `toColorValue(color, options)` | Convert a theme color to a CSS color string. |
| `autoDarkColor(section, key, context, light)` | Generate an automatic dark color for a Tailwind palette color (drives the `darkColor` option). |

These are the same helpers the official presets use (see `packages/preset-*/src/rules.ts` and `src/variants.ts`).

## Sheets

| Function | Signature | Purpose |
| -------- | --------- | ------- |
| `getSheet` | `getSheet(useDOMSheet?, disableResume?) → Sheet` | Environment sheet: `virtual` on server, `dom`/`cssom` in browsers. |
| `virtual` | `virtual(includeResumeData?) → Sheet<string[]>` | Collect CSS into an array (SSR). |
| `cssom` | `cssom(element?) → Sheet` | Fast DOM sheet. |
| `dom` | `dom(element?) → Sheet` | Debug-friendly DOM sheet. |
| `stringify` | `stringify(target) → string` | Render a sheet target to a CSS string. |

## SSR Helpers

| Function | Signature | Purpose |
| -------- | --------- | ------- |
| `inline` | `inline(html, { tw?, minify? }) → string` | Update all `class` attributes in HTML and inject a `<style>` into `<head>`. |
| `extract` | `extract(html, tw?) → { html, css }` | Update class attributes; return HTML and CSS separately. |
| `consume` | `consume(markup, tw?) → string` | Update class attributes and inject all styles into `tw`. **Used by this project's streaming middleware.** |

## DOM Observation (shim mode)

| Function | Signature | Purpose |
| -------- | --------- | ------- |
| `mo` | `mo(tw?) → MutationObserver` | Create a mutation observer bound to a `tw` instance. |
| `observe` | `observe(tw, target?) → observer` | Start observing class attributes and injecting styles. Only needed in the browser / Shadow DOM. |

## Autocomplete

| Function | Purpose |
| -------- | ------- |
| `withAutocomplete(config, provider)` | Augment config with autocomplete provider support. |
| `getAutocompleteProvider(config)` | Get the autocomplete provider for a config (editor integration). |

## Misc Utils

| Function | Signature | Purpose |
| -------- | --------- | ------- |
| `hash` | `hash(value) → string` | Hash a string (used by `hash` config). |
| `escape` | `escape(value) → string` | Escape for CSS selectors/variables. |
| `mql` | `mql(screen, prefix?) → string` | Build a media query from a screen value. |
| `asArray` | `asArray(value)` | Coerce a value to an array. |
| `identity` | `identity(value)` | Identity function (used as `minify` no-op in this project). |
| `noop` | `noop()` | No-op function. |

## Key Types

`Twind`, `TwindConfig`, `TwindUserConfig`, `TwindPresetConfig`, `Preset`, `Rule`, `Variant`, `Theme`, `BaseTheme`, `ScreenValue`, `ColorValue`, `ColorFunction`, `CSSBase`, `CSSObject`, `CSSValue`, `Preflight`, `Sheet`, `StringLike`, `MaybeArray`, `ThemeFunction`, `RestoreSnapshot`, `ParsedRule`.

## Notes For This Project

- Import paths: `@twind/core`, `@twind/preset-autoprefix`, `@twind/preset-tailwind`, `@twind/preset-typography` (npm specifiers in `deno.json`).
- `IS_PRODUCTION` (from `@/constants/env.ts`) is passed to `install`.
- The `identity` import in `app/middleware/twind.ts` is used as the default `minify` no-op.
