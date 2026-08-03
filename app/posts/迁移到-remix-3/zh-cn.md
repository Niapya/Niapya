---
title: 迁移到 remix@3
createdAt: "2026-07-29T21:24:00.000Z"
updatedAt: "2026-07-30T01:44:00.000Z"
language: zh-cn
generated: false
summary: >-
  迁移到 Remix v3 后，我们发现它抛弃了 React，改用自研的 TypeScript UI 框架和显式的 Islands 模型，默认在服务器生成完整
  HTML，仅在标记为 `clientEntry` 的组件中才会注入 JavaScript。借助 Remix 内置的 TypeScript/JSX
  loader 与 asset server，实现了“无构建步骤”的按需 ESM 加载，同时配合 Twind 动态生成 Tailwind
  CSS、Satori + Resvg 生成 SVG/PNG 动态图片，让交互可以完全依赖原生表单或视图过渡。尽管框架仍在
  Beta、生态尚不成熟，需要自行编写中间件并适配部署平台，但作者认为 Remix v3 已经能够在保持类型安全、组件化与渐进增强的前提下，实现无需
  bundle 的现代 Web 应用，并计划继续关注其发展。
---

最近，我们把这个博客迁移到了 `remix@3`。

Remix v3 不是 Remix v2 的一次常规升级，它抛弃了
React，之后自己做了一个全栈框架。它仍处于 Beta 阶段，API 和生态都很年轻。

我决定在这么早的阶段使用 Remix v3，是因为我真的喜欢它，它回归到了 Web API
的本质。

## 一瞥 Remix v3

Remix v3 最引人注目的是没有用 React ，而是重写了一套 TypeScript UI 框架。

Remix 组件不是 React 组件，也没有 Hooks。组件接收一个
`handle`，然后返回真正的渲染函数。

```tsx
function Greeting(handle: Handle<{ name: string }>) {
  return () => <p>Hello, {handle.props.name}</p>;
}
```

状态更新、事件、服务端渲染和水合都围绕这套模型展开。页面默认在服务器上生成
HTML；只有被 `clientEntry()` 明确标记的组件，才会成为浏览器里的 JavaScript
边界。服务端会为这些边界留下标记并序列化 props，浏览器中的 `run()`
再按需加载对应模块并完成水合。比如一个计数器可以显式声明为 client entry：

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

这里的 `import.meta.url` 是服务端源码地址，比如
`file:///app/components/counter.tsx`。SSR 遇到这个组件时会调用
`resolveClientEntry()`，把源码地址交给 asset server，换成浏览器能访问的 URL：

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

服务端仍然先输出按钮的 HTML，但会使用注释标记它拥有的 DOM
区域，大致类似下面这样：

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

上面的 HTML 是为了说明协议而简化的，但关键结构来自 Remix runtime：一对 `rmx:h`
注释负责划定水合区域，`rmx-data` 保存模块地址、export name 和可序列化的
props。即使 JavaScript 还没有下载，用户已经能看到服务器输出的按钮。

接着浏览器入口启动 `run()`。runtime 读取 `rmx-data`、遍历注释标记，并把每个
`moduleUrl + exportName` 交给 `loadModule()`：

```ts
const app = run({
  async loadModule(moduleUrl, exportName) {
    const module = await import(moduleUrl);
    return module[exportName];
  },
});

await app.ready();
```

此时才发生真正的网络请求：浏览器执行
`import("/assets/app/components/counter.tsx")`时 asset server 从磁盘读取 TSX，用
Oxc 解析和转换语法，再把文件里的 `import` 改写成公开 URL。

浏览器拿回的是标准 ESM，`loadModule()` 取出其中的 `Counter` export，runtime
用序列化 props 重建虚拟节点，最后在两条注释之间 hydrate 已有 DOM，并挂上 click
listener。相同模块的加载还会被缓存，页面上有十个 Counter 也不会请求十次。

你可能开始感觉有点复杂，但这是一套真正显式的 Islands
架构，不是先把整棵组件树变成客户端应用，再想办法减少
JavaScript，而是默认没有客户端组件，只有确实需要交互的地方才去添加岛屿。

不仅如此，在 AI 时代，Remix 写了一切。`remix/data-schema` 提供了类似
Zod、Valibot 的 schema、检查、转换和 `parseSafe()`，它也支持 Standard
Schema，所以不得不佩服 Remix 的胆量。

最简单的对象验证很像其他 schema library，schema
本身同时描述了运行时约束和输出类型：

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

最后，它遵循 Standard Schema。`s.parse()` 和 `s.parseSafe()` 不只接受 Remix
自己的 schema，也能接收 Zod、Valibot 或 ArkType schema。

除此之外，Remix 还提供路由、中间件、会话、认证和 data table
等一系列彼此配合的包。所有能力都从 `remix/<subpath>` 导入，边界非常清楚。

### Why should we have a build step?

Remix v3 的另一个激进选择，是不把 build step 当作应用运行的前提。

Remix 自己写了一个 TypeScript/JSX loader，在 Node.js 中，可以通过 `--import`
flags 使用。

```sh
node --import remix/node-tsx ./server.ts
```

`remix/node-tsx` 会在模块被 Node 执行前转换 `.ts` 和 `.tsx`。

有人就问了，那浏览器呢？浏览器肯定不能运行 TypeScript 的代码，Remix
的解决办法很巧妙。

需要客户端 JavaScript 时，Remix 的 asset server 可以从源码提供模块、改写
import，并生成 preload 和带指纹的 URL。比如可以把源码目录映射为 `/assets`
下的公开地址：

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

当浏览器请求一个 TSX entry 时，asset server 才转换这个模块，并把它依赖的 import
改写成浏览器可以继续请求的 URL。

`allow` 和 `deny`
同时构成安全边界，避免服务端文件意外暴露。它仍然会做编译，但不需要提前运行一次
build，也不需要生成和部署一个 `dist` 目录。

它内部直接组合了 Oxc parser、transform、minifier 和 resolver，再用
`es-module-lexer` 改写源码、Lightning CSS 处理样式。

更惊喜的是 `fileMap` 不只可以映射 `app/`，也可以把 `node_modules/`
放进同一张依赖图：

```ts
fileMap: {
  "/app/*path": "app/*path",
  "/npm/*path": "node_modules/*path",
}
```

假设 Counter 里写了 `import { on } from "remix/ui"`，asset server 会解析这个裸
specifier，找到 `node_modules` 里的真实 package export，再把它改写成类似
`/assets/npm/remix/ui/index.js` 的浏览器 URL。浏览器请求这个 URL 时，asset
server 继续读取、分析并返回它；依赖还可以继续引用自己的依赖。整个 node_modules
不是被预先塞进一个 bundle，而是像源码一样按 ESM 依赖图按需加载。

`getPreloads()` 还可以提前遍历这张图，把将要请求的模块变成
`<link rel="modulepreload">` 或 `Link` header：

```ts
const preloads = await assetServer.getPreloads([
  "app/components/counter.tsx",
]);
// /assets/app/components/counter.tsx
// /assets/npm/remix/ui/index.js
// ...它们继续依赖的模块
```

这就是很 amazing 的地方，它保留了浏览器原生 ESM 的请求模型，同时仍然能执行
TypeScript 转换、package resolution、preload、source map、minify 和
fingerprint，却没有要求我们先产出一个 bundle。

## 准备事项

其实，我认为原生的 Web API
已经足够强大，我们完全可以依赖原生来实现一切。对此，我为新首页设置了几个目标：

- 没有客户端 JavaScript 参与

  博客本来就是一个轻量的程序，所有页面都可以是静态的，没有客户端 JavaScript
  参与，顶多在评论时使用表单，这部分完全可以用 HTML 来解决。

- 没有构建流程

  Remix 的 dev 脚本、start
  脚本都没有用到构建流程，所以我们也不想添加一个，我想要直接 push
  到远程仓库，直接可以运行。

- 实现一个博客的全部功能

  一个博客应该有统计、评论、验证码等功能，应该有一个好的 UI 和 UX，有一个
  TOC，以及很好的交互效果。

当应用不再依赖传统 bundler，过去由构建工具顺手完成的事情就需要重新设计。为了保留
Tailwind 的开发体验、流式 SSR 和动态图片，我们做了几项额外工作。

### 用 Twind 为 SSR 生成 Tailwind CSS

这个项目使用 Twind 的 Tailwind preset，而不是运行 Tailwind CLI
扫描源码并生成一份静态 CSS。Twind 可以读取最终 HTML 中出现的
class，并按需生成对应样式，这很适合没有构建步骤的服务端应用。

问题在于 Remix 返回的是流，而不是一个完整字符串。为此我们写了一个 `twind()`
中间件：

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

它先等待下游完成 SSR，只处理 `text/html` 响应，然后把 `response.body` 接入一个
`TransformStream`。流中的 HTML 会交给 Twind `consume()` 扫描，首个文档片段生成的
CSS 被注入 `<head>`。

如果后续 Remix Frame 又流式返回了新的
class，中间件会比较前后两份样式，只把增量补丁写回页面。关键部分是给每一段流维护独立的
Twind 快照：

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

保存和恢复全局快照很重要，因为 Twind 的实例是进程级的，而 SSR
请求会并发发生。每个响应都应该只看到自己的
class，不能把另一个请求刚生成的规则混进来。首次 flush 把完整样式放入
`<head>`；后续 flush 只发送插入位置和新增 CSS，由一小段内联脚本修补同一个
`<style>`。

它没有破坏流式渲染，浏览器仍然可以尽快收到文档外壳，后续片段也能获得正确样式。

与此同时，我们仍可使用 Tailwind 风格的原子类、Typography、Autoprefixer、主题
token 和暗色模式，不需要额外的构建命令。

### Satori 生成验证码

Satori 是 Vercel 开源的 JSX/对象到 SVG 渲染器。它不是浏览器截图工具，不需要启动
Chromium，而是在服务端根据布局对象和字体数据直接计算出 SVG。我们再用 Resvg 把
SVG 栅格化成 PNG。

最直接的用途是动态 Open Graph 图片。本站会先使用 `remix/data-schema` 限制 URL
中标题的长度，再把中英文字体显式交给 Satori，最后返回 PNG：

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

这很简单对吧？我们实现了首页以及每个博客的 OG
image，不过更有意思的是评论验证码。

服务端随机生成一组不同颜色和形状的图形，并选定其中一个目标。Satori 和 Resvg
把挑战渲染为图片，目标位置和一次性 token 则保存在 Deno KV 中。页面使用原生
HTML：

```html
<input type="image" name="captcha" src="..." />
```

用户点击图片后，浏览器会随普通表单一起提交 `captcha.x` 和 `captcha.y`，这是
[`<input type="image">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/image)
原生定义的行为。

服务端只需要用 `remix/data-schema/form-data` 验证 token
与坐标，再判断点击位置是否落在目标图形附近。challenge 带有短
TTL，并在提交后原子删除，因此同一个答案不能重复使用。

这里真正有意思的不是验证码算法，而是实现思路，Satori 负责生成挑战，Deno KV
保存短暂状态，原生 image input 负责收集点击坐标，普通 HTTP form
负责提交。整个流程没有事件监听、`fetch()` 或任何 client-side JavaScript。

## 迁移工作

为了实现我定的那几个目标，实现思路已经很明确了，就是全部使用 SSR 服务器端渲染。

```text
TypeScript / TSX + Markdown
        ↓
    runtime
        ↓
 Remix 流式 SSR
        ↓
Twind 注入 CSS + Satori 生成图片
        ↓
   HTML / CSS / HTTP
```

### 押注 SSR 渲染

Remix 的 JSX runtime 来自 `remix/ui`，他自身做的真的很多。

路由需要先在 `app/routes.ts` 中声明成一份带类型的 URL 契约。

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

再由 controller 返回标准 `Response`。

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

`render()` 最后调用 `renderToStream()`，得到的可以直接放进 `Response` 的
`ReadableStream<Uint8Array>`。

```ts
Deno.serve((request) => router.fetch(request));
```

GET、POST、重定向、语言协商和错误响应都在同一条 HTTP 链路里完成。

评论表单验证失败时，还能让 controller
重新渲染带错误信息的页面，成功时则返回重定向。

这里没有一套服务端模板再加一套客户端状态，HTML 就是状态的最终表达形态。

### CSS 新属性注入活力

最近几年，浏览器加入了很多过去必须依赖 JavaScript
才能完成的能力。对这个项目最有用的是跨文档 View Transitions 和 Scroll-driven
Animations。

既然我们没有客户端 JS，所以这必须是个 MPA，而不是 SPA。

页面间导航仍然是普通的 `<a>` 和完整文档请求，但通过
`@view-transition { navigation: auto; }`，浏览器可以为跨文档导航提供 View
Transitions。

比如博客列表与文章页为标题设置相同的
`view-transition-name`，于是两次独立的服务端响应也能形成连续的视觉过渡。

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

列表页的 `<h2>` 与文章页的 `<h1>` 使用同一个稳定名称。浏览器在两次 document
navigation 之间为旧标题和新标题建立对应关系，整个过程不需要 SPA router。

我们还在文章内部实现了由 scroll-driven animation 驱动的阅读时间线。

我们先简单封装了一个 `ScrollDrivenAnimation` 组件。

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

文章容器声明一个命名的 view
timeline，每个刻度按照自己在全文中的百分比消费其中一段进度：

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

我们根据 Markdown 各节的字数计算。
长章节占据更长的时间线，标题刻度同时是普通锚点链接，所以它既是阅读进度，也是一份不依赖
JavaScript 的 TOC。

### i18n, a11y 和其他

i18n 也放在请求边界完成。`locale()` 中间件先读取 URL 的
`?lang=`，没有显式选择时再解析 `Accept-Language` 及其 `q`
权重，然后把语言写入类型化的 `LangContext`：

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

这个值不只决定正文文案，还同时决定 `<html lang>`、日期 locale、OG
locale、manifest URL 和动态 OG 图片中的字体。

语言信息从一个请求事实向下传递，不需要浏览器启动后再修正页面，因此首屏 HTML
对搜索引擎和读屏软件也是完整的。

关于 a11y，使用新 Web 能力并不意味着忽略兼容性。

View Transition
与滚动动画都是渐进增强，支持它们的浏览器得到更连贯的体验，不支持时仍然保留普通跳转、锚点和内容。

与此同时 `prefers-reduced-motion` 则直接关闭动画，让系统设置成为最终决定。

## 部署

没有构建步骤带来了更直接的开发与部署模型，也让运行平台的差异变得无法回避。

我们先后考察了 Cloudflare Workers、Vercel 和 Deno。

### Cloudflare Workers

Workers 是优秀的边缘运行时，但它不是传统服务器环境。应用代码需要被打包成 Worker
可部署的模块，运行时也没有可供应用任意读取的本地文件系统。

对于许多应用，这是合理限制，对于这个博客，却意味着必须在部署前把
Markdown、字体和其他源码资产收集进 bundle，或者迁移到外部存储。我们希望仓库 push
后就能直接运行，文章仍然是磁盘上的 Markdown，运行时能够读取项目文件。

因此 Workers 与这次迁移最核心的 buildless 目标并不匹配。

### Vercel

Remix 官方为 Node 准备的 buildless 路径依赖 `node --import remix/node-tsx`。

在我们考察的 Vercel 托管函数运行入口中，无法为 Node 进程自由追加这类启动
flag，也就不能按照 Remix 推荐的方式直接把 TS 和 TSX 源码作为服务端入口运行。

当然，可以增加一次构建，加上 `esbuild`
这种构建流程，把代码转成平台期望的产物，但那等于重新引入我们刚刚移除的步骤。

因此这一次也没有选择 Vercel。

### Deno

Deno 最终成为最自然的答案。它原生执行 TypeScript 和 TSX，不需要 Node 的
`--import` loader。

现在的 Deno 也不再是特立独行。它能够直接使用 npm 包，提供成熟得多的 Node
兼容层，同时支持 WebAssembly、Deno FFI 和 Node-API 的 `.node` 原生 addon。

```json
{
  "tasks": {
    "start": "deno run --allow-env --allow-ffi --allow-read --allow-net deno.ts"
  }
}
```

这个项目因此可以同时运行 Remix、Twind、Satori 和依赖 `.node` 原生 addon 的
Resvg，并用 `Deno.serve()` 接收请求、用 Deno KV 保存评论与一次性验证码。

再加上足够个人站点使用的免费额度，Deno 让这套架构保持了它原本的形状。

源码就是应用，没有生成目录，没有必须提交或上传的
bundle，也没有为了适配平台而额外维护一套方式。

## 总结

迁移到 Beta 框架当然有代价。

文档、API、生态和部署经验都在快速变化，我们没有成熟的生态，所以需要自己阅读源码、编写中间件。

但是 Remix 3 考虑到了这一点。如今 AI 的发展，Remix 3 的库所有都是 TypeScript
文件，这使得 Remix 3 是对 Agent 友好的，而不是像 Next.js
加一堆编译器魔法，尤其是 `use client` 这样的 Directive。

而且它没有像 Next.js 那样自己实现一个 PPR 协议，而是从 Web API
本身出发去构建，而且做到了路由、服务器、组件、数据边界和渐进增强的效果。

你可以使用 Islands、Frame 和客户端水合，也可以像这个网站一样，一个 client entry
都不创建。

Remix v3 还很新，我们也仍在继续看它的发展，但是说明了现代 Web
应用自己本身可以拥有类型安全、组件化、动态图片和交互，同时把服务器、浏览器与开放标准放在最中心的位置。
