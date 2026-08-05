# Aliases And Component Styles

## What This Covers

Reusable bundles of utilities as a single class: `shortcut` (`~`) and `apply` (`@`) aliases, inline in class strings, via `rules`, or via helper functions. The generated alias is always a single class placed in the `shortcuts` layer, so other utilities can override it.

## Shortcut vs Apply

- `shortcut` — styles are generated as if the utilities were used alone. For conflicting utilities, the later one wins (`p-2 p-0` → `p-2` wins).
- `apply` — styles are generated in the order declared. For conflicting utilities, the declared order wins (`p-2 p-0` → `p-0` wins). Matches Tailwind's `@apply`.

> Prefer `shortcut` almost always. Use `apply` only when the implicit style order does not match what you want. For complex scenarios, prefer the `style` helper (`references/api-reference.md`).

## Inline Shortcuts

```html
<!-- anonymous -->
<div class="~(py-2 px-4 font-semibold rounded-lg shadow-md)">…</div>

<!-- named -->
<div class="Card~(py-2 px-4 font-semibold rounded-lg shadow-md)">…</div>
```

Anonymous `~(...)` accepts comma-separated tokens too: `~(text-red-500,underline)`.

## Inline Apply

```html
<!-- anonymous -->
<div class="@(py-2 px-4 font-semibold rounded-lg shadow-md)">…</div>

<!-- named -->
<div class="Card@(py-2 px-4 font-semibold rounded-lg shadow-md)">…</div>
```

## Overriding A Shortcut

Named shortcuts let component consumers selectively override styles:

```tsx
import { cx } from "@twind/core";

function Card({ className, ...props }) {
  return (
    <div
      class={cx("Card~(py-2 px-4 font-semibold rounded-lg shadow-md)", className)}
      {...props}
    />
  );
}

// Standard
<Card />;

// Override
<Card class="rounded-sm shadow-none" />;
```

## `shortcut` And `apply` Helpers

> `shortcut` and `apply` do **not** inject styles. The returned class name must be used in a class attribute or class string (or passed to `tw`).

```ts
import { shortcut, apply } from "@twind/core";

// anonymous
const card = shortcut("py-2 px-4 font-semibold rounded-lg shadow-md");
const btn = apply("bg-green-500 hover:bg-green-700 text-white");

// named
const card = shortcut.Card("py-2 px-4 font-semibold rounded-lg shadow-md");
const btn = apply.Btn("bg-green-500 hover:bg-green-700 text-white");
```

## In Rules

Aliases can be registered in `rules` (see `references/configuration.md`), including dynamic ones:

```ts
rules: [
  ["card", "py-2 px-4 font-semibold rounded-lg shadow-md"],
  ["card-", ({ $$ }) => `bg-${$$}-400 text-${$$}-100 py-2 px-4 rounded-lg`],
  ["btn-green", "@(bg-green-500 hover:bg-green-700 text-white)"],
],
```
