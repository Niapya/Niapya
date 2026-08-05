# Utilities And Syntax

## What This Covers

Writing Twind class strings: Tailwind v3 utilities, variants, the `!` important modifier, arbitrary values, grouping syntax, comments, and the `group`/`peer` parent/sibling modifiers.

## Tailwind v3 Utilities

With `@twind/preset-tailwind`, all Tailwind v3 utilities and variants are available out of the box. The theme's `screens`, `colors`, `spacing`, `fontFamily`, `borderRadius`, `boxShadow`, etc. sections feed these utilities. See `references/configuration.md` for how this project extends them.

```html
<h1 class="text-3xl font-bold underline">Hello world!</h1>
<button class="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground">
  Submit
</button>
```

## Variants

Variants scope a utility to a condition and are prefixed with `variant:`.

- Responsive: `sm:`, `md:`, `lg:`, `xl:`, `2xl:` (from the `screens` theme)
- Pseudo-classes: `hover:`, `focus:`, `active:`, `focus-visible:`, `checked:`, `disabled:`, ...
- Pseudo-elements: `before:`, `after:`, `placeholder:`, `selection:`, ...
- Dark mode: `dark:` (respects `darkMode` config — `media` in this project)
- Group/peer: `group-hover:`, `group-focus-visible:`, `peer-checked:`, ...

```html
<button
  class="bg-primary hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 sm:w-auto w-full"
>
  Submit
</button>
```

## Important Modifier

Prefix any utility with `!` to mark its declarations important:

```html
<p class="!text-red-500">…</p>
```

## Arbitrary Values

Use `[...]` for one-off values the theme does not cover. CSS variables, `var()`, and `theme(...)` work inside brackets.

```html
<div class="w-[17px] text-[1.375rem] bg-[var(--ring)] p-[clamp(1rem,2vw,2rem)]">
  …
</div>
```

Arbitrary variants also work: `[&>*]:my-4`, `md:[@media(orientation:landscape)]:block`.

## Grouping Syntax

Grouping factors out a shared prefix to reduce repetition. It is opt-in — grouped and ungrouped forms compile to identical CSS.

### Directive Grouping

Factor out a common directive prefix with parentheses:

```html
<div class="w-(full sm:auto) text-(sm white)">…</div>
<!-- expands to: w-full sm:w-auto text-sm text-white -->
```

### Variant Grouping

Factor out a common variant; multiple lines are allowed inside template literals:

```ts
cx`
  bg-red-500 shadow-xs
  sm:(
    bg-red-600
    shadow-sm
  )
  md:(bg-red-700 shadow)
  lg:(bg-red-800 shadow-xl)
`
```

### Mixed Grouping

Directive groups can nest inside variant groups and vice versa. Nesting responsive variants inside responsive variants is not permitted.

```ts
cx`sm:(border-(2 black opacity-50 hover:dashed))`
// => sm:border-2 sm:border-black sm:border-opacity-50 sm:hover:border-dashed

cx`rotate-(-3 hover:6 md:(3 hover:-6))`
// => -rotate-3 hover:rotate-6 md:rotate-3 md:hover:-rotate-6
```

### Important Grouping

```ts
cx`!(text-(sm green-500))`
// => !text-sm !text-green-500
```

### Self Reference

Some directives (like `ring`) must apply themselves and act as a prefix. The reserved `&` is replaced literally with the current prefix:

```ts
cx`ring(& pink-700 offset(4 pink-200))`
// => ring ring-pink-700 ring-offset-4 ring-offset-pink-200

cx`bg-blue-500(hover:& focus:& active:&)`
// => hover:bg-blue-500 focus:bg-blue-500 active:bg-blue-500
```

## Comments

Class strings and template literals accept CSS-style comments:

```ts
cx`
  underline
  /* multi
    line
    comment
  */
  hover:focus:!{
    sm:{italic why}
  }
  !top-1 !-bottom-2
`
```

## Group And Peer Modifiers

Named and unnamed groups/peers target child styles based on parent/sibling state.

- Default: `group-hover:text-white`, `peer-checked:bg-blue-500`
- Named with `~`: `group~project-hover:text-white`, `group~create-hover:text-white`
- Attribute selector form: `group[disabled]:text-gray-200`, `group~project[disabled]:text-gray-200`

```html
<div class="group~project bg-white hover:bg-blue-500">
  <p class="text-gray-900 group~project-hover:text-white">New Project</p>
</div>
```

Name may contain any characters except whitespace, `(`, `)`, `:`, `-`, and `[`.
