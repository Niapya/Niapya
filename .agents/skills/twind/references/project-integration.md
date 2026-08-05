# Project Integration

## What This Covers

How Twind is wired into this Deno + Remix 3 project specifically: the shared config in `app/middleware/twind.ts`, the SSR streaming middleware, and the project-specific conventions for writing classes. This project does **not** use any `@twind/with-*` framework integration package — it wires Twind itself. For the compile chain and why the middleware works the way it does, see `pipeline.md`.

## Dependencies

Declared in `deno.json` under `imports` (npm specifiers):

- `@twind/core` (`npm:@twind/core@^1.1.3`)
- `@twind/preset-autoprefix`
- `@twind/preset-tailwind`
- `@twind/preset-typography`
- `fast-diff` — used by the middleware to diff incremental CSS between stream flushes

Always add twind-related deps with `deno i <spec>` (JSR gets `jsr:` prefix, npm gets `npm:` prefix). Do **not** add `@twind/with-*` integration packages — the streaming middleware replaces them.

## The Twind Instance

`app/middleware/twind.ts` defines `twindConfig` (presets + `darkMode: "media"` + `theme.extend`) and exports:

```ts
export const tw = install(twindConfig, IS_PRODUCTION);
```

- `IS_PRODUCTION` comes from `@/constants/index.ts`.
- The instance is a server-side singleton driven by the middleware — components never observe the DOM.
- `themeVariables` is a `CSSBase` object passed as `preflight: [themeVariables]`, defining `:root`/`.dark` CSS variables, view-transition and scrollbar styles, and `body`/selection defaults. Keep base/reset styling here rather than sprinkling it in components.

## How Styles Stream Into HTML

The `twind()` middleware (registered in `app/router.ts` between `openGraph()` and `render()`) wraps HTML responses in a `TwindStream` `TransformStream`. See `pipeline.md` → "Streaming compile" for the full walkthrough. In short:

1. Text is decoded and buffered (`state.push`).
2. At flush points (a `<!-- rmx:flush ... -->` marker, end of `</template>`, or end of `</html>`), it runs `consume(buffer, tw)` to compile every `class` attribute into the instance, then `stringify(tw.target)` to produce the CSS for that chunk.
3. On the first flush it injects `<style data-twind>${css}</style></head>`. On later flushes it computes a diff of the CSS (via `fast-diff`) and emits a tiny inline script that patches the existing `style` element's textContent.
4. `tw.snapshot()`/`restoreCurrentState` guards make streaming safe by restoring the sheet state after each chunk.

Implications:

- **Write plain class strings.** Any `class` attribute in the final HTML is compiled automatically — no need to call `tw()` or `tx()` in components.
- Class names appearing only in JavaScript (never in serialized HTML) would not be compiled. For dynamic browser-side classes the instance APIs would be required, but this project is pure SSR.
- New theme tokens or rules added to `twindConfig` apply automatically to all subsequent requests.

## Themed Color Tokens

The `colors` object in `app/middleware/twind.ts` maps Tailwind color names to CSS variables (`color("primary")` → `var(--primary)`), covering `border`, `input`, `ring`, `background`, `foreground`, `primary`, `secondary`, `destructive`, `muted`, `accent`, `popover`, `card`, `sidebar`, and `chart` (1–5). Prefer these semantic tokens over raw Tailwind palette colors so light/dark mode works for free.

## Conventions When Writing Classes

- Reuse semantic tokens: `text-foreground`, `bg-background`, `border-border`, `text-primary`, `bg-muted`, `text-muted-foreground`.
- Prefer preset integer utilities; avoid arbitrary bracket values and `px` when a standard utility works (see `SKILL.md` → Project Style Conventions).
- Effects should be CSS-only: `transition-*`, `duration-*`, `ease-out`, `after:` pseudo-element patterns, `group-hover:`, `motion-reduce:`.
- When Tailwind can't express a value, write a component-local `css()` mixin imported from `remix/ui` and attach it via `mix={mixin}` — do not use inline `style`.
- For dark-mode overrides rely on `darkMode: "media"`, so `dark:` reflects `prefers-color-scheme` automatically.

## Common Mistakes In This Project

- Adding styles to individual components that belong in `themeVariables` (base/reset) or `theme.extend` (tokens).
- Using `className` instead of `class`.
- Calling `tw()`/`tx()` inside components — unnecessary and bypasses the streaming flow.
- Importing twind helpers from `@twind/core` for host-element mixins when the project convention is `css` from `remix/ui`.
- Editing the middleware's streaming logic without considering `tw.snapshot()` state — the guards exist to keep streaming chunks deterministic.
