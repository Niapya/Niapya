---
title: Migrate to remix@3
language: en
generated: true
summary: >-
  We migrated our blog to the beta Remix v3, which abandons React in favor of a
  TypeScript‑based UI model and an explicit “islands” architecture where only
  components marked with `clientEntry` become client‑side JavaScript. By
  leveraging Remix’s built‑in TypeScript loader, a lazy asset server, Twind for
  on‑the‑fly Tailwind CSS, and Satori‑generated SVG/PNG captchas, we achieved a
  fully server‑rendered site with no build step, no default client scripts, and
  native Web‑API‑driven interactions. Although the ecosystem and documentation
  are still maturing, the migration demonstrates that Remix v3 can deliver
  type‑safe, componentized, and dynamically rich web applications while keeping
  the server, browser, and open standards at the core.
createdAt: '2026-07-29T21:24:00.000Z'
updatedAt: '2026-07-30T01:44:00.000Z'
---

Recently, we migrated this blog to `remix@3`.

Remix v3 is not a routine upgrade from Remix v2; it drops React and builds a full‑stack framework on its own. It is still in Beta, and both the API and ecosystem are young.

I decided to use Remix v3 at such an early stage because I really like it—it returns to the essence of Web APIs.

## A Glimpse of Remix v3

The most striking thing about Remix v3 is that it doesn’t use React; instead it rewrites a TypeScript UI framework.

Remix components are not React components, and there are no Hooks. A component receives a
`handle` and then returns a true render function.

```tsx
function Greeting(handle: Handle<{ name: string }>) {
  return () => <p>Hello, {handle.props.name}</p>;
}
```

State updates, events, server‑side rendering, and hydration all revolve around this model. Pages render HTML on the server by default; only components explicitly marked with `clientEntry()` become JavaScript boundaries in the browser. The server leaves markers for these boundaries and serializes their props, and the browser’s `run()` lazily loads the corresponding modules and hydrates them. For example, a counter can be explicitly declared as a client entry:

```tsx
export const Counter = clientEntry(
  import.meta.url,
  function Counter(handle: Handle<{ initialCount: number }>) {
    let count = handle.props.initialCount;

    return () => (
      <button
        mix={on("click", () => {
          count++;
          handle.update();
        })}
      >
        {count}
      </button>
    );
  },
);
```

Here `import.meta.url` is the server‑side source file path, e.g.
`file:///app/components/counter.tsx`. When SSR encounters this component it calls
`resolveClientEntry()`, passing the source path to the asset server, which rewrites it to a URL the browser can fetch:

```tsx
const stream = renderToStream(<App />, {
  async resolveClientEntry(entryId, component) {
    return {
      href: await assetServer.getHref(entryId),
      exportName: component.name,
    };
  },
});
```

The server still outputs the button’s HTML first, but it marks the region of DOM it owns with comments, roughly like this:

```html
<!--rmx:h:counter-1-->
<button>0</button>
<!--/rmx:h-->

<script type="application/json" id="rmx-data">
{
  "c": {
    "counter-1": {
      "moduleUrl": "/assets/app/components/counter.tsx",
      "exportName": "Counter",
      "props": { "initialCount": 0 }
    }
  }
}
</script>
```

The HTML above is simplified for protocol illustration, but the essential structure comes from the Remix runtime: a pair of `rmx:h` comments delimit the hydration area, and `rmx-data` stores the module URL, export name, and serializable props. Even before any JavaScript is downloaded, the user can see the server‑rendered button.

Then the browser entry runs `run()`. The runtime reads `rmx-data`, walks the comment markers, and hands each `moduleUrl + exportName` to `loadModule()`:

```ts
const app = run({
  async loadModule(moduleUrl, exportName) {
    const module = await import(moduleUrl);
    return module[exportName];
  },
});

await app.ready();
```

Only now does a real network request happen: when the browser executes
`import("/assets/app/components/counter.tsx")`, the asset server reads the TSX from disk, parses and transforms it with Oxc, and rewrites the file’s imports to public URLs.

The browser receives a standard ESM file; `loadModule()` extracts the `Counter` export, the runtime reconstructs the virtual node with the serialized props, hydrates the existing DOM between the two comments, and attaches the click listener. Loading the same module again is cached, so ten `Counter`s on the page do not trigger ten requests.

It may start to feel complicated, but this is a truly explicit Islands architecture: instead of turning the whole component tree into a client‑side app and then trying to trim JavaScript, there are no client components by default—only the parts that truly need interaction become islands.

Moreover, in the AI era, Remix writes everything. `remix/data-schema` provides Zod‑like, Valibot‑like schemas, checks, transformations, and `parseSafe()`. It also supports Standard Schema, which makes us admire Remix’s boldness.

The simplest object validation looks like other schema libraries; the schema itself describes both runtime constraints and output types:

```ts
import * as s from "remix/data-schema";
import { email, minLength } from "remix/data-schema/checks";

const User = s.object({
  name: s.string().pipe(minLength(2)),
  email: s.string().pipe(email()),
  role: s.defaulted(s.string(), "reader"),
});

const user = s.parse(User, {
  name: "Ada",
  email: "ada@example.com",
});
```

Finally, it follows Standard Schema. `s.parse()` and `s.parseSafe()` accept not only Remix’s own schemas but also Zod, Valibot, or ArkType schemas.

Beyond that, Remix offers a suite of coordinated packages for routing, middleware, sessions, authentication, and data tables. All capabilities are imported from `remix/<subpath>`, making the boundaries very clear.

### Why should we have a build step?

Another radical choice in Remix v3 is not treating a build step as a prerequisite for running the app.

Remix ships its own TypeScript/JSX loader that can be used in Node.js via `--import` flags.

```sh
node --import remix/node-tsx ./server.ts
```

`remix/node-tsx` transforms `.ts` and `.tsx` files before Node executes them.

Someone might ask, “what about the browser?” The browser obviously can’t run TypeScript code, so Remix’s solution is clever.

When client‑side JavaScript is needed, Remix’s asset server can serve modules directly from source, rewrite imports, and generate preload links and fingerprinted URLs. For example, you can map the source directory to a public address under `/assets`:

```ts
import { createAssetServer } from "remix/assets";

const assetServer = createAssetServer({
  rootDir: process.cwd(),
  basePath: "/assets",
  fileMap: {
    "/app/*path": "app/*path",
    "/npm/*path": "node_modules/*path",
  },
  allow: ["app/assets/**", "node_modules/**"],
  deny: ["app/**/*.server.*"],
});

router.get("/assets/*", ({ request }) => assetServer.fetch(request));
```

When the browser requests a TSX entry, the asset server transpiles that module and rewrites its imports to URLs the browser can fetch.

`allow` and `deny` together form a security boundary that prevents accidental exposure of server‑only files. The server still compiles, but there is no need to run a build ahead of time or generate and deploy a `dist` directory.

Internally it composes Oxc parser, transformer, minifier, and resolver, then uses `es-module-lexer` to rewrite source, and Lightning CSS for styles.

A pleasant surprise is that `fileMap` can also bring `node_modules/` into the same dependency graph:

```ts
fileMap: {
  "/app/*path": "app/*path",
  "/npm/*path": "node_modules/*path",
}
```

Suppose `Counter` imports `on` from `"remix/ui"`. The asset server resolves that bare specifier, finds the real package export inside `node_modules`, and rewrites it to something like `/assets/npm/remix/ui/index.js`. When the browser requests that URL, the asset server reads, processes, and returns it; its dependencies are further resolved in the same way. The entire `node_modules` is not pre‑bundled but loaded on demand following the ESM dependency graph, just like source files.

`getPreloads()` can walk this graph ahead of time and turn the modules that will be requested into `<link rel="modulepreload">` tags or `Link` headers:

```ts
const preloads = await assetServer.getPreloads([
  "app/components/counter.tsx",
]);
// /assets/app/components/counter.tsx
// /assets/npm/remix/ui/index.js
// …and the modules they depend on
```

That’s the amazing part: it retains the browser’s native ESM request model while still performing TypeScript transformation, package resolution, preload generation, source‑map handling, minification, and fingerprinting—without requiring us to emit a bundle first.

## Preparations

In fact, I believe the native Web API is already powerful enough for us to rely on it to implement everything. With that in mind, I set a few goals for the new homepage:

- **No client‑side JavaScript participation**  
  The blog is inherently lightweight; every page can be static, with no client JavaScript involved, at most using a form for comments, which can be solved entirely with HTML.

- **No build process**  
  Remix’s dev and start scripts do not involve a build step, so we don’t want to add one either. I want to push directly to the remote repo and be able to run immediately.

- **Implement all blog functionality**  
  A blog should have stats, comments, captchas, etc., a good UI/UX, a table of contents, and nice interaction effects.

When an app no longer depends on a traditional bundler, tasks that were previously handled automatically by the build system need to be redesigned. To preserve Tailwind’s developer experience, streaming SSR, and dynamic images, we performed a few extra steps.

### Generating Tailwind CSS for SSR with Twind

This project uses Twind’s Tailwind preset rather than running the Tailwind CLI to scan source files and produce a static CSS file. Twind can read the `class` attributes that appear in the final HTML and generate the necessary styles on demand, which fits a server‑side app without a build step.

The challenge is that Remix returns a stream, not a complete string. To handle that we wrote a `twind()` middleware:

```ts
export function twind(): Middleware {
  return async ({ request }, next) => {
    const response = await next();

    /* ... */

    return new Response(
      response.body.pipeThrough(new TwindStream(), {
        signal: request.signal,
      }),
      { status: response.status },
    );
  };
}
```

It first waits for downstream SSR to finish, processes only `text/html` responses, and then pipes `response.body` through a `TransformStream`. The HTML flowing through the stream is given to Twind’s `consume()` for scanning; the CSS generated from the first document fragment is injected into `<head>`.

If a later Remix Frame stream emits new classes, the middleware compares the previous and current style sets and writes only the incremental patch back to the page. The key is keeping an independent Twind snapshot for each chunk of the stream:

```ts
const restoreGlobalState = tw.snapshot();
restoreCurrentState();

let html = consume(buffer, tw);
const nextStyle = stringify(tw.target);

restoreCurrentState = tw.snapshot();
restoreGlobalState();

if (lastStyle === null) {
  html = html.replace(
    "</head>",
    `<style data-twind>${nextStyle}</style></head>`,
  );
} else {
  const styleDiff = getStyleDiff(lastStyle, nextStyle);
  if (styleDiff.length) html = createStylePatch(styleDiff) + html;
}
```

Saving and restoring the global snapshot is crucial because Twind’s instance is process‑wide, while SSR requests happen concurrently. Each response must see only its own classes and must not mix rules generated for another request. The first flush puts the complete stylesheet into `<head>`; subsequent flushes only send insertion points and new CSS, which a tiny inline script patches into the same `<style>` element.

This does not break streaming rendering; the browser still receives the document shell as early as possible, and later fragments receive the correct styles.

Meanwhile we can continue using Tailwind‑style atomic classes, Typography, Autoprefixer, theme tokens, and dark mode without any extra build commands.

### Satori‑Generated Captchas

Satori is Vercel’s open‑source JSX/object‑to‑SVG renderer. It isn’t a browser screenshot tool; it runs on the server, directly computing an SVG from layout objects and font data. We then rasterize the SVG to PNG with Resvg.

The most straightforward use case is dynamic Open Graph images. Our site first validates the title length in the URL with `remix/data-schema`, feeds both Latin and Chinese fonts explicitly to Satori, and finally returns a PNG:

```ts
const parsed = s.parseSafe(
  ogImageQuerySchema,
  new URL(request.url).searchParams,
);
const title = parsed.success ? parsed.value.title : "";

const svg = await satori(createCard(lang, title), {
  width: 1200,
  height: 630,
  fonts: [
    {
      data: RENDER_FONT_DATA.instrumentSerif,
      name: "Instrument Serif",
      weight: 400,
    },
    {
      data: RENDER_FONT_DATA.notoSerifSc,
      name: "Noto Serif SC",
      weight: 400,
    },
  ],
});

const png = new Resvg(svg).render().asPng();

const body = png.buffer.slice(
  png.byteOffset,
  png.byteOffset + png.byteLength,
) as ArrayBuffer;

return new Response(body, {
  headers: {
    "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    "Content-Type": "image/png",
    Vary: "Accept-Language",
  },
});
```

Simple, right? We’ve implemented OG images for the homepage and each blog post, but the more interesting part is the comment captcha.

The server randomly generates a set of shapes with different colors and chooses one as the target. Satori and Resvg render the challenge as an image, while the target position and a one‑time token are stored in Deno KV. The page uses native HTML:

```html
<input type="image" name="captcha" src="..." />
```

When the user clicks the image, the browser submits `captcha.x` and `captcha.y` together with the normal form—this is the behavior defined by the native `<input type="image">` element.

The server only needs to validate the token and coordinates with `remix/data-schema/form-data`, then check whether the click landed near the target shape. The challenge has a short TTL and is atomically deleted after submission, so the same answer cannot be reused.

What’s truly interesting isn’t the captcha algorithm but the implementation approach: Satori generates the challenge, Deno KV holds short‑lived state, the native image input collects click coordinates, and a regular HTTP form submits everything. No event listeners, `fetch()`, or any client‑side JavaScript are involved.

## Migration Work

With the goals defined, the implementation path was clear: use SSR everywhere.

```text
TypeScript / TSX + Markdown
        ↓
    runtime
        ↓
 Remix streaming SSR
        ↓
Twind injects CSS + Satori generates images
        ↓
   HTML / CSS / HTTP
```

### Betting on SSR Rendering

Remix’s JSX runtime lives in `remix/ui`, and it does a lot of heavy lifting.

Routes must first be declared as a typed URL contract in `app/routes.ts`.

```ts
export const routes = route({
  home: "/",
  blog: route("/blog", {
    index: get("/"),
    article: get("/:slug"),
    comment: post("/:slug/comments"),
  }),
});
```

Controllers then return a standard `Response`.

```tsx
export default createController(routes, {
  actions: {
    home({ get, render }) {
      const i18n = createI18n(get(LangContext));
      return render(<Home i18n={i18n} />);
    },
  },
});
```

`render()` ultimately calls `renderToStream()`, producing a `ReadableStream<Uint8Array>` that can be placed directly into a `Response`.

```ts
Deno.serve((request) => router.fetch(request));
```

GET, POST, redirects, content‑negotiation, and error responses all happen within a single HTTP pipeline.

If comment form validation fails, the controller can re‑render the page with error messages; on success it returns a redirect.

There is no separate server‑side template plus a client‑side state layer—the HTML itself is the final representation of state.

### Injecting New CSS Capabilities

In recent years browsers have added many capabilities that previously required JavaScript. The most useful for this project are cross‑document View Transitions and Scroll‑driven Animations.

Since we have no client JS, this must be an MPA, not an SPA.

Page navigation remains ordinary `<a>` links with full document requests, but with `@view-transition { navigation: auto; }` the browser can provide View Transitions across document navigations.

For example, the blog list and article pages give their titles the same
`view-transition-name`, so the two independent server responses can create a seamless visual transition.

```ts
export function blogPostTitleTransitionName(slug: string) {
  return createDomId("blog-post-title", slug);
}
```

```tsx
<h1
  style={{
    viewTransitionName: blogPostTitleTransitionName(post.slug),
  }}
>
  {post.title}
</h1>;
```

The `<h2>` on the list page and the `<h1>` on the article page share a stable name. The browser builds a correspondence between the old and new titles across the navigation, without any SPA router.

We also implemented a scroll‑driven animation timeline for reading progress inside articles.

First we wrapped a simple `ScrollDrivenAnimation` component:

```tsx
export function ScrollDrivenAnimation(
  handle: Handle<ScrollDrivenAnimationProps>,
) {
  const {
    timeline = "view()",
    range = "entry 0% cover 40%",
    keyframes,
  } = handle.props;

  const animationStyle = css({
    animationName: `scroll-${handle.id}`,
    animationDuration: "1ms",
    animationFillMode: "both",
    animationTimeline: timeline,
    animationRange: range,
    [`@keyframes scroll-${handle.id}`]: keyframes,
  });

  return () => <div mix={animationStyle}>{handle.props.children}</div>;
}
```

The article container declares a named view timeline, and each segment consumes a portion of that timeline based on its percentage of the total text:

```ts
const articleTimelineStyle = css({
  viewTimelineAxis: "block",
  viewTimelineName: "--article-reading",
});
```

```tsx
<ScrollDrivenAnimation
  timeline="--article-reading"
  range={`cover 40% cover 60%`}
  keyframes={{
    from: { color: "var(--border)" },
    to: { color: "var(--foreground)" },
  }}
>
  <span data-timeline-line />
</ScrollDrivenAnimation>;
```

We calculate the number of words in each Markdown section; longer sections occupy more of the timeline, and the heading marks also serve as ordinary anchor links. Thus the heading is both a reading progress marker and a JavaScript‑free TOC.

### i18n, a11y, and Others

Internationalization is also handled at the request boundary. The `locale()` middleware first reads `?lang=` from the URL, falls back to parsing `Accept-Language` and its `q` weights, then writes the language into a typed `LangContext`:

```ts
export function locale(): Middleware {
  return (context, next) => {
    context.set(LangContext, getLangFromRequest(context.request), {
      property: "lang",
    });
    return next();
  };
}
```

This value determines not only the body copy but also `<html lang>`, date locale, OG locale, manifest URL, and the fonts used in dynamic OG images.

The language information propagates down from a single request fact, so the browser never needs to adjust the page after load—first‑paint HTML is complete for search engines and screen readers.

Regarding accessibility, using new Web capabilities does not mean ignoring compatibility.

View Transitions and scroll‑driven animations are progressive enhancements: supported browsers get a smoother experience, while others retain normal navigation, anchors, and content.

At the same time, `prefers-reduced-motion` can completely disable the animations, letting system settings take precedence.

## Deployment

Removing the build step yields a more direct development and deployment model, but also makes platform differences unavoidable.

We evaluated Cloudflare Workers, Vercel, and Deno.

### Cloudflare Workers

Workers are an excellent edge runtime, but they are not a traditional server environment. Application code must be bundled into a module that Workers can deploy, and the runtime provides no local filesystem that the app can read arbitrarily.

For many apps this limitation is fine, but for a blog it would require gathering Markdown files, fonts, and other source assets into a bundle before deployment, or moving them to external storage. We want the repository to be push‑ready and to read Markdown directly from disk at runtime.

Therefore Workers do not align with our core build‑less goal.

### Vercel

Remix’s official build‑less path for Node relies on `node --import remix/node-tsx`.

In the Vercel serverless function entry we examined, there is no way to freely add such a startup flag to the Node process, so we cannot run TS/TSX source files directly as Remix recommends.

We could add a build step using `esbuild` to produce the expected output, but that would re‑introduce the step we deliberately removed.

Hence we did not choose Vercel.

### Deno

Deno turned out to be the most natural answer. It natively executes TypeScript and TSX without needing Node’s `--import` loader.

Modern Deno also supports npm packages, offering a much more mature Node compatibility layer, plus WebAssembly, Deno FFI, and Node‑API `.node` native addons.

```json
{
  "tasks": {
    "start": "deno run --allow-env --allow-ffi --allow-read --allow-net deno.ts"
  }
}
```

Thus the project can run Remix, Twind, Satori, and the Resvg native addon together, use `Deno.serve()` to handle requests, and store comments and one‑time captchas in Deno KV.

With the free tier sufficient for a personal site, Deno keeps the architecture in its original shape.

The source is the app—no generated directory, no required bundle to commit or upload, and no extra tooling to adapt to a specific platform.

## Conclusion

Migrating to a beta framework certainly has costs.

Documentation, API, ecosystem, and deployment experience are evolving rapidly; we lack a mature ecosystem, so we have to read source code and write our own middleware.

But Remix 3 accounted for that. With AI gaining momentum, Remix 3’s libraries are all TypeScript files, making Remix 3 agent‑friendly, unlike Next.js with its myriad compiler tricks, especially directives like `use client`.

Moreover, Remix does not implement its own PPR protocol; it builds directly on Web APIs, achieving routing, server, components, data boundaries, and progressive enhancement.

You can use Islands, Frames, and client‑side hydration, or, like this site, create zero client entries.

Remix v3 is still very new, and we are continuing to watch its development, but it demonstrates that modern web applications can have type safety, componentization, dynamic images, and interaction while keeping the server, browser, and open standards at the core.
