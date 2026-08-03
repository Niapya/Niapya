---
title: Welcome To Niapya's Blog
language: en
generated: true
summary: >-
  The author argues that, despite the dominance of AI‑generated “Vibe‑coded”
  blogs, a personal blog should remain fully under the author’s control, so they
  built a lightweight static‑site generator using Hono/JSX for
  templating, marked for Markdown, and UnoCSS for atomic styling, resulting in a
  site with zero client‑side JavaScript. They demonstrate a working prototype
  and outline future plans to evolve it into a full framework with plugins, a
  retro UI component library, and optional SSR, all open‑sourced on GitHub.
createdAt: "2026-07-27T03:25:00.000Z"
updatedAt: "2026-07-27T03:25:00.000Z"
---

Yes, I finally have a blog.

2026 is the year **Vibe Coding** exploded. We've gotten used to using **Code
Agent** to write any project, and the old “hand‑coded” approach is mocked as
“ancient programming”. By now most people have lost the habit of writing code
themselves; if they want a blog, they just **Vibe** a `Next.js` template, or
even use an off‑the‑shelf **SaaS** blogging platform with `Skills` and let an
Agent write the posts.

But I think a blog, as a personal platform, should be fully controlled by the
author. So I want to build my own blogging framework, my own blog style, and my
own blog content from scratch.

## Building the Blog Framework

Since sites of this type usually don’t need server‑side logic, we call them
**static sites**. What I need to create is a
**[Static Site Generator](https://developer.mozilla.org/en-US/docs/Glossary/SSG)**
(SSG).

The SSG workflow is simple: fetch a content source and parse it into documents,
render them with templates, and output the result as website files. I want to
control every step.

### Step 1 – Fetch the content source and parse it into documents

The source can be anything: a database, a CMS, Markdown files, etc. To unify the
process we define an interface like this:

```ts
export function definePost(
  input: {
    title: string;
    category?: string[];
    tags?: string[];
    content: string;
  },
): Post;
```

Now we can define our content anywhere, in any way. In the future plugins could
pull content from file routes, databases, or even the browser.

Blog content (`content`) is usually written in Markdown, so I use **marked** to
compile Markdown to HTML, together with **marked‑highlight** and
**highlight.js** for code highlighting.

```ts
import hljs from "highlight.js";
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";

const markdownRenderer = new Marked({
  breaks: false,
  gfm: true,
});

markdownRenderer.use(
  markedHighlight({
    emptyLangClass: "hljs",
    langPrefix: "hljs language-",
    highlight(code, language) {
      const highlightLanguage = hljs.getLanguage(language)
        ? language
        : "plaintext";

      return hljs.highlight(code, { language: highlightLanguage }).value;
    },
  }),
);

await markdownRenderer.parse(markdown, { renderer });
```

### Step 2 – Render with templates

Because we are producing website files, most SSGs tie the template closely to
the HTML structure. If you pick a custom template language you have to define an
AST and a compiler yourself—for example, Astro’s `.astro` files are a
proprietary component syntax. You’d also need to build a toolchain for type
checking and syntax highlighting, which hurts developer experience.

Some SSGs use React/Vue components as templates. Those feel nice to develop
with, but they tend to be tightly coupled to the respective framework’s
ecosystem and can unintentionally pull in client‑side JavaScript. For an SSG,
pulling in any unnecessary client JavaScript by default is unwise.

So I chose a lightweight solution: JSX powered by **Hono/JSX** for templates. It
lets us write JSX, render it on the server, and output an HTML string while
keeping type safety. For pure static pages the resulting HTML files contain no
framework‑related client code.

```tsx
export function HtmlArticle({ html }) {
  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

const app = new Hono()
  .get("/", (c) => {
    return c.html(<HtmlArticle html={markdownRenderer.parse(markdown)} />);
  });
```

### Step 3 – Output as website files

After defining content and templates we need to define the site structure (aka
routes). Since we’re using **Hono/JSX**, we can declare routes with an HTTP
framework—Hono fits the bill. With Hono we can also spin up a dev server easily.

> Later we could also use this approach for Server‑Side Rendering (SSR), but for
> now we focus on SSG.

Hono provides a `toSSG` method that pre‑renders the Hono app’s routes into
static files at build time, allowing us to output static files directly from
Hono.

## Styling the Blog

Applying CSS in JSX has always been tricky—CSS Modules, until atomic solutions
like **TailwindCSS** arrived.

We chose **UnoCSS** as our CSS solution because it generates atomic CSS on
demand and offers a programmable generator API that can compile class names into
CSS code.

```ts
import { createGenerator, presetWind4 } from "unocss";

const uno = await createGenerator({
  presets: [presetWind4()],
});

export async function compileAtomicCss(input: string): Promise<string> {
  const { css } = await uno.generate(input);
  return css;
}
```

For the default blog style I went with a classic Macintosh look. We’re planning
to use Figma and create a corresponding UI component library to deliver a
retro‑styled blog theme.

## Future Plans

You may notice that this blog uses **no client‑side JavaScript**, which is
exactly what I wanted. A static blog doesn’t need any client JavaScript.

The source code is available on GitHub.

Eventually we hope to turn this project into a real framework and release our
own UI component library, along with features such as:

- Plugin‑based RSS and Sitemap generation
- Search and comment systems based on HTML Form
- An online compiler
- Possible full‑stack SSR support

Because we don’t rely on **Vite** and we avoid dependencies that only work in a
**Node.js** environment, this framework could even run directly in the browser
in the future.
