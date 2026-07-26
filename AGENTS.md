# 项目规范

这是一个 Deno + Remix 3 作品集。

所有你了解到的 Remix 3 的知识都是错的，先阅读 [remix Skills](./.agents/skills/remix/SKILL.md) 了解 Remix 3 的基本概念和约束。

## 命令

```sh
deno install          # 安装依赖
deno task dev         # 开发模式，端口 44100
deno task start       # 生产模式
deno task test        # 运行测试
deno task check       # 类型检查 + lint
deno task format      # 格式化检查
```

## 架构

- 入口: `deno.ts` -> `app/router.ts` -> `app/routes.ts`
- JSX 运行时: `remix/ui`（非 React）
- 导入方式: `import { ... } from "remix/<subpath>"`，禁止 `import { ... } from "remix"`
- 组件模式: `function Name(handle: Handle<Props>) { return () => ... }`，非 React hooks

## 纯 SSR 规范

- 所有页面通过服务端渲染生成 HTML，不使用客户端 JavaScript，不禁止使用 `clientEntry()`、`run()` 等客户端交互 API
- 页面间导航通过标准 HTTP 请求实现，不使用 SPA 路由
- 表单提交使用标准 HTML form，不使用 AJAX
- 如需交互效果，优先考虑 CSS 动画和过渡

## 目录结构

```
app/
├── actions/           # Route Handler（纯请求处理，不含 JSX）
│   ├── controller.tsx        # 顶层路由的 action
│   └── <route-key>/
│       └── controller.tsx    # 嵌套路由的 action
├── pages/             # 页面级组件（按路由组织）
│   ├── home/
│   │   └── index.tsx
│   ├── about.tsx              # 简单页面单文件
│   └── projects/
│       ├── index.tsx
│       ├── list.tsx           # 页面专属子组件就近放置
│       └── card.tsx
├── ui/                # 共享 UI 组件（跨页面复用、无业务逻辑）
│   ├── document.tsx
│   ├── nav.tsx
│   └── button.tsx
├── i18n/              # 国际化
├── middleware/         # 中间件
├── routes.ts          # 路由契约定义
├── router.ts          # 路由注册和中间件配置
└── constants.ts       # 常量
```

## 路由所有权

- 从 `app/routes.ts` 出发，每个路由映射到最窄的磁盘所有者
- 顶层路由操作放在 `app/actions/controller.tsx`
- 嵌套路由需要独立操作时，添加 `app/actions/<route-key>/controller.tsx`
- 路由本地模块放在对应控制器旁
- 共享 UI 移到 `app/ui/`

## 开发约束

- 始终用 `deno i` 安装依赖，JSR 包加 `jsr:` 前缀，npm 包加 `npm:` 前缀
- 保持目录结构简洁，按需添加 `app/data/`、`test/` 等目录
- 优先使用最窄的所有者，避免引入共享模块
- 禁止创建 `app/lib/`、`app/components/` 等通用存放目录
- `deno task check` 合并了类型检查和 lint，无需单独运行

## 注意事项

- Remix 组件非 React: `function Name(handle: Handle<Props>) { return () => ... }`
- 在边界处使用 `remix/data-schema` 验证输入
- 控制器返回 `Response` 对象，不使用 throw 控制流程
- 导入始终使用 `remix/<subpath>`，禁止顶级导入
