---
title: Welcome To Niapya's Blog
createdAt: "2026-07-27T03:25:00.000Z"
updatedAt: "2026-07-27T03:25:00.000Z"
language: zh-cn
generated: false
summary: >-
  作者认为博客应由作者完全掌控，于是从零实现了一个基于 Hono/JSX 的静态站点生成器，使用 `marked` 解析 Markdown、`UnoCSS`
  生成原子化 CSS，并在构建时渲染成纯 HTML 文件，从而避免任何客户端
  JavaScript。文章展示了内容获取、模板渲染和文件输出的完整流程，并说明了选择轻量化方案的理由。作者计划将该项目发展为完整的框架并提供 UI
  组件库、插件化 RSS/Sitemap、表单搜索评论等功能，甚至支持在浏览器中运行。
---

对，我终于有了一个博客。

2026 年是 Vibe Coding 大火的一年，我们习惯了使用 Code Agent
来编写任何项目，原来的「手搓」代码的方式被调侃为「古法编程」，这个时候大部分人都没有动手习惯了，如果他们希望有一个博客，直接
Vibe 一个 `Next.js` 模版，甚至直接用现成的 `SaaS` 博客平台加上 `Skills` 让 Agent
帮忙写文章就好了。

但是我认为，博客作为自己的平台，理应是由作者掌控一切的，所以我希望可以从无到有做出一个自己的博客框架、自己的博客样式以及博客内容。

## 制作博客框架

由于这类网站通常不需要服务器端逻辑，我们把博客这类网站称之为「静态网站」，所以我要做的是一个「[静态站点生成器](https://developer.mozilla.org/en-US/docs/Glossary/SSG)」（Static
Site Generator，SSG）。

SSG
的流程很简单：获取内容源并解析成文档，使用模板渲染，输出为网站文件，而我希望掌控这一切。

第一步是获取内容源并解析成文档。

内容源的来源可能是任何东西，数据库、CMS、Markdown
文件等等，所以我们创建了一个统一的 Interface，类似于下面。

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

这样一来，我们可以在任何地方以任何方式定义我们的内容了。未来我们可以使用插件，从文件路由、数据库来源，甚至浏览器中获取内容。

博客的内容 `content` 通常以 Markdown 格式编写，所以我使用 `marked` 来把 Markdown
编译为 HTML，并配合 `marked-highlight` 与 `highlight.js` 提供代码高亮。

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

第二步是使用模板渲染。

由于我们要编写的是网站文件，在大多数 SSG 中，这个模板一般会和 HTML
结构强相关。如果选择自定义模板语法，就需要自己定义 AST 和编译器来处理，比如
Astro 的 `.astro`
模板本身就是一套框架自有的组件语法。与此同时，你还需要开发用于类型检查和语法高亮的工具链，这实在不利好开发者体验。

还有一些 SSG 使用 React/Vue
组件来编写模板，这样的模板虽然开发体验不错，但它们通常会和对应框架的生态绑定得更深。如果处理不当，甚至可能默认引入客户端
JavaScript。对于 SSG 来说，默认引入任何不必要的客户端 JavaScript 都是不明智的。

所以我选择了一个轻量的方案 —— 由 `Hono/JSX` 驱动的 JSX 来编写模板。它可以在使用
JSX 语法的情况下进行服务端渲染，最终输出 HTML
字符串，同时保持类型安全。对于纯静态页面来说，最终输出的 HTML
文件也不需要包含任何框架相关的客户端代码。

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

第三步是输出为网站文件。

定义好内容和模板之后，我们需要定义网站的结构（也可以称之为路由）。既然我们使用
`Hono/JSX`，那我们可以通过一个 HTTP 框架来定义路由，Hono 就是这样的。而且借助
Hono 框架，我们可以轻松启动开发服务器。

> 在后续，我们还可以通过这种方式进行服务端渲染（SSR），但目前我们先专注于 SSG。

Hono 提供了 `toSSG` 方法，能够在构建时把 Hono
应用的路由预渲染成静态文件，这样我们就可以通过 Hono 来输出静态文件了。

## 设置博客样式

在 JSX 中设置 CSS 一直是一个难题，比如 CSS Modules，直到诸如 `TailwindCSS`
这样的原子化 CSS 方案出现。

我们选择了 `UnoCSS` 作为我们的 CSS 解决方案，因为它可以按需生成原子化
CSS，并且提供了可编程的生成器 API，可以直接把 CSS 类名编译成 CSS 代码。

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

默认的博客样式我选择了一个经典的麦金塔风格，我们正在计划使用 Figma 并制作相关的
UI 组件库，以打造一个复古风格的博客主题。

## 后续

你也许会发现，本博客没有用到任何客户端
JavaScript，这正是我想要的，对于一个静态博客，他不需要客户端 JavaScript 的引入。

你可以在 GitHub 上找到这个项目的源代码。

我们未来应该会把这个项目变成一个真正的框架，然后推出一套自己的 UI 组件库。

以及下面的功能：

- 插件支持的 RSS 与 Sitemap 功能
- 基于 HTML Form 的搜索和评论系统
- 在线编译器
- 以及可能的 SSR 全栈支持

因为我们没有用到 `Vite`，也尽量避免依赖只属于 `Node.js`
环境的模块，所以这个框架未来甚至可以在浏览器中直接运行。
