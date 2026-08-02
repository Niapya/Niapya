---
title: 如何构建一个无服务器 Agent
createdAt: 2026-07-27T03:25:00.000Z
updatedAt: 2026-07-27T04:10:00.000Z
---

4 月初，我们开源了 Serverless 项目
[ClawLess](https://github.com/Niapya/clawless)，它可以在你的 Vercel
账户上免费部署一个 24 小时可用的轻量 Agent。

这篇文章想记录的是 ClawLess 背后的取舍：为什么它应该是 Serverless
的，以及我们如何用 Vercel Workflow、Vercel AI SDK、Vercel Sandbox、KV、Blob 和
Postgres Vector 组装出一个能工作的 Agent。

## 起因

**构建一个完整、长期在线的 Agent 运行时，成本其实不在模型，而在一直运行。**

模型你可以选择低价或者免费的模型，但你仍然需要一个自己的服务器、VPS，或者一台长期在线的
Mac mini。

有些项目已经提出了另一种解决方案：使用更小的原生语言重写运行时，把内存占用压低，让它可以运行在树莓派、开发板，或者更便宜的
Linux 设备上。

他们至少需要一个长期在线的设备来运行
Agent，维护它的状态，等待用户消息，处理定时任务，而 ClawLess
一开始就不是这个方向。

对大多数人来说，Agent 最常见的入口仍然是 chatbot：用户发送消息，Agent
读取上下文、调用工具、返回结果。它不需要每一秒都在 CPU
上运行，它只需要在被唤醒时可靠地处理请求。

我们只需要在它接收到会话的时候处理请求即可：

- 如果是在网页上，那就是在用户发送消息时触发的 API 请求。
- 如果连接你的 IM，那就是 IM 在收到请求时触发的 webhook，也可以是 API 请求。

除此之外，我们还需要定时任务和延迟任务。比如「明天提醒我继续这个话题」，或者「每天早上把某个
channel 的信息整理一下」。这类任务本质上不要求常驻进程，只要求平台能把某个
workflow 暂停、等待，并在合适的时间继续。

老朋友都知道我比较喜欢
Serverless。它的核心是请求进来时启动，任务挂起时休眠，时间到了再恢复。

由于这种特性，Serverless 服务平台可以以非常低的价格部署，特别是对于 JS Rutime
的，比如 AWS Lambda、Vercel、Cloudflare Workers，而且很多平台都有足够尝鲜的 free
tier。

经过调研，我看上了 Vercel Workflow。它可以启动长时间任务，可以在 Workflow
里等待，也可以在特定时间继续执行，因此 ClawLess 可以被消息、Webhook、工具审批和
schedule 唤醒的 Workflow。

换句话说，ClawLess 并不需要你一直运行，只需要按需唤醒。这恰好是 Workflow
这类运行时擅长的事情。

## 设计

因为同时有前后端，这是一个全栈项目。

对于全栈，我们曾尝试过使用 Nuxt，或是 Hono SSR 的方式来构建全栈，但我们采用
Next.js 来作为全栈框架，因为我们要使用 Vercel Workflow 的 API 来构建 Agent，而
Next.js 是 Vercel Workflow 的原生支持框架。

## Workflow 是 Agent 的运行时

我们先谈一下 Vercel Workflow，它是 Vercel
最近推出的官方、长时间运行的、带有状态的流程运行框架。经测试，一个 workflow
能运行至少 10 分钟以上。

> 我们在做 ClawLess 的时候，Vercel Workflow 还是处于 Beta 阶段，但是现在 API
> 已经稳定。

它使用 `"use workflow";` 和 `"use step";` 指令来定义一个 workflow。

- `use workflow` 负责“编排”，也就是跨步骤的状态、等待、恢复和整体流程。
- `use step` 负责“执行”，也就是可以单独重试、适合封装副作用的原子操作。

对于 Agent 来说，真正调用数据库、第三方 API、Sandbox 命令的逻辑，通常放在到
`step` 里；而等待用户消息、等待审批，比如等待明天早上 9
点继续执行的逻辑，则更适合留在 `workflow` 这一层。

一个 Workflow 的例子如下：

```ts
async function updateUser(userId: string) {
  "use step";
  await db.insert({ id: userId });
}

export async function userOnboardingWorkflow(userId: string) {
  "use workflow";
  await updateUser(userId);
}

export async function POST() {
  await updateUser("123");
}
```

然后对于 AI 来说，毫无疑问，TypeScript 最流行的 AI framework 是 Vercel AI SDK。

```ts
import { convertToModelMessages, streamText, type UIMessage } from "ai";

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: "anthropic/claude-sonnet-4.5",
    system: "You are a helpful assistant.",
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
```

然后在前端，你可以使用
[`useChat`](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat) 这个 Hook
来轻松地实现一个聊天界面。

```ts
"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";

export default function Page() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });
  const [input, setInput] = useState("");

  return (
    <>
      {messages.map((message) => (
        <div key={message.id}>
          {message.role === "user" ? "User: " : "AI: "}
          {message.parts.map((part, index) =>
            part.type === "text" ? <span key={index}>{part.text}</span> : null
          )}
        </div>
      ))}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) {
            sendMessage({ text: input });
            setInput("");
          }
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={status !== "ready"}
          placeholder="Say something..."
        />
        <button type="submit" disabled={status !== "ready"}>
          Submit
        </button>
      </form>
    </>
  );
}
```

> `useChat` Hooks 还提供了 Vue, Svelte 和 Angular 的库。

这已经能完成一个很好用的 Web Chat。但它还不是我们要的 Durable
Agent，因为请求中断/结束之后，运行时也就跟着结束了。

这与我们 Agent
的逻辑不同，我们希望在请求中断后还能继续运行，并且在运行后持久化以保存状态。

所以我们的 Workflow 配备了 AI 模块，它和 AI SDK 深度集成，并提供了更适合
workflow 场景的 `DurableAgent`。

Workflow 的 `getWritable()`
可以拿到一个持久化的输出流，客户端断开以后还能重新连接回来，继续接收之前没看完的内容。

下面这段是一个简化示意：

```ts
import { DurableAgent } from "@workflow/ai/agent";
import { getWritable } from "workflow";
import type { UIMessage, UIMessageChunk } from "ai";

export async function chatWorkflow(messages: UIMessage[]) {
  "use workflow";

  const writable = getWritable<UIMessageChunk>();
  const agent = new DurableAgent({
    model: "anthropic/claude-sonnet-4.5",
    system: "You are a helpful assistant.",
  });

  await agent.stream({
    messages,
    writable,
  });
}
```

这时候，Agent 才真正开始像一个自主的系统。

> 在 ClawLess 中，我们的过程更加复杂，主 workflow 会从 KV 读取当前配置，构建
> system prompt，从 MCP 加载工具，创建 `DurableAgent`，然后把输出写到 UI message
> stream，并且持久化，最后再把状态保存到 Postgress SQL 中。

## Hook 让 workflow 真正可交互

考虑更多，比如用户在网页继续发消息，或者 IM webhook 继续发消息时，如果 workflow
还在运行，我们应该去引导（Follow-up）Agent 处理这些消息，而不是直接发起新的
workflow。

> 这是 Human in the Loop 的基本逻辑。如果你想了解更多，你可以看 WikiPedia 中的
> [HITL, Human-in-the-Loop](https://en.wikipedia.org/wiki/Human-in-the-loop).

庆幸的是，Workflow 提供了 hook 来做到这些。hook 的价值是：它允许一个正在运行的
workflow 暂停在某个位置，等外部事件到来之后再继续。

最简单的外部事件就是“下一条用户消息”：

```ts
import { defineHook } from "workflow";

// 定义一个 hook，用于接收外部事件（下一条用户消息）
export const messageHook = defineHook<{
  text: string;
  userId: string;
}>();

export async function conversation(sessionId: string) {
  "use workflow";

  const events = messageHook.create({
    token: "chat-" + sessionId,
  });

  // 等待外部事件（下一条用户消息）
  for await (const event of events) {
    console.log("Received", event.text, "from", event.userId);
  }
}

export async function POST(req: Request) {
  const data = await req.json();

  await messageHook.resume("chat-" + data.sessionId, {
    text: data.text,
    userId: data.userId,
  });

  return new Response("OK");
}
```

同一个机制也很适合做工具审批。比如模型想执行一个高风险命令：删文件、发消息、下单、转账，这时候就不该让它直接运行，而是要把审批请求抛给前端，再等用户确认。

> 更多信息详见 AI SDK 中关于
> [Tool Execution Approval](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling#tool-execution-approval)
> 的说明。

Workflow hook 的好处是，你不需要自己轮询数据库，不需要写一套复杂的状态机，因为
workflow 会在等待时挂起，恢复时又从原来的状态继续。

所以，我们总结一下一个 Agent 的顺序：

1. 用户消息进入入口层。
2. 入口层判断当前 session 是否已有活动中的 workflow。
3. 如果有，就用 hook 把新消息送回去。
4. 如果没有，就创建新的 workflow，从头开始处理。

## 上下文 Context

Agent 有上下文限制（Context Limit）。不同模型的 token
计算方式不同，但它们都有一个共同限制：你必须把 system
prompt、历史消息、工具结果、文件输入和记忆都塞进上下文里。

不仅如此，模型在处理长上下文时，正确率也会下降，成本也会增加。

处理长上下文有常见的两种方法，压缩和剪枝。

压缩（Compression）是把“很长但以后还需要”的历史，改写成更短的表示。最常见的做法是：在会话进行到一定长度之后，用模型把早期对话、关键工具结果、已经确认的用户偏好压成一段摘要，然后把原始消息移出当前上下文窗口。

下一轮真正调用模型时，你只需要把摘要重新组装回来。

> 如果你考虑更多，你可以采用滚动窗口的方法，把摘要和最近几轮的原始消息以及当前输入加进来。

```ts
import { generateText, type ModelMessage } from "ai";

export async function compactMessages(messages: ModelMessage[]) {
  const summary = await generateText({
    model,
    messages: [
      ...messages,
      {
        role: "user",
        content: "请总结一下我们之前的对话，提炼出对后续有帮助的关键信息。",
      },
    ],
  });

  return {
    summary: summary.text,
    recentMessages: messages.slice(-8),
  };
}
```

在 Workflow 里，这种做法尤其自然。因为 workflow
本来就有自己的生命周期和外部存储层，你完全可以在某一轮结束后把摘要写入
KV，把旧消息删掉，只保留一个“会话摘要”字段。这样 durable session
仍然存在，但真正送进模型的上下文不会无限增长。

另一种方法是剪枝（Pruning）。它不试图理解历史，而是直接把“对当前轮次帮助不大”的内容裁掉。

AI SDK 已经提供了 `pruneMessages`，可以在送进模型之前移除旧的
reasoning、工具调用结果、审批痕迹和空消息。

```ts
import { type ModelMessage, pruneMessages } from "ai";

export function buildContextWindow(messages: ModelMessage[]) {
  const pruned = pruneMessages({
    messages,
    reasoning: "before-last-message",
    toolCalls: "before-last-2-messages",
    emptyMessages: "remove",
  });

  const pinned = pruned.filter((message) => message.role === "system");
  const recent = pruned.filter((message) => message.role !== "system").slice(
    -12,
  );

  return [...pinned, ...recent];
}
```

对于 Workflow AI，通常会在每一轮调用前通过 `prepareStep` 来重写。

```ts
const result = await agent.stream({
  messages,
  writable,

  // prepareStep hook 会在每次调用模型前被调用，用来重写上下文窗口
  prepareStep: async ({ messages: currentMessages }) => {
    return {
      messages: buildContextWindow(currentMessages),
    };
  },
});
```

这两种方法并不冲突。实际工程里更常见的是组合使用，完全取决于设计。

> 这是有关 Context Engineering 的概念，你可以阅读 Anthropic 的文章
> [Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents).

但是，我们还要要考虑的更多，比如说跨对话的请求之间的，同一知识之间的，或者是永久保存的上下文共享，这个时候我们需要引入工具来把它们存储在外部系统里，而不是直接放在模型上下文里。

## 工具 Tools

**Agent 的工具决定了它的能力边界。**

如果没有工具，它只是一个聊天模型；有了工具，它才可以保存记忆、执行命令、学习技能、安排任务，甚至把一部分工作交给子
Agent。

在 AI SDK 里，工具本身就是一等公民。一个最小的工具定义大概像这样：

```ts
import { tool } from "ai";
import { z } from "zod";

const tools = {
  remember: tool({
    description: "Save a useful fact into long-term memory",
    inputSchema: z.object({
      note: z.string(),
    }),
    execute: async ({ note }) => {
      const memory = await buildMemory(note);
      return { ok: true, memory };
    },
  }),
};
```

### 记忆 Memory

记忆是存储长期事实，用户偏好的部分。

你可以把它存储到 KV、数据库，或者以文件形式存储到
Blob，然后给模型添加工具来管理它。

在搜索时，最方便的时全文关键词搜索，但是有很多局限性，比如两个句话关联性强但是没有重叠。

你在公司内部系统搜索“如何处理产假期间的奖金核算”。问题：如果公司制度里使用的是“生育津贴”、“女职工福利”或“长期病假（生育）规定”，而没有同时包含“产假”和“奖金”这两个具体词汇，全文搜索会直接显示“未找到相关结果”，即便系统里实际上有相关的政策文档。

所以，我们可以考虑
[RAG, Retrieval-augmented generation, 检索增强生成](https://en.wikipedia.org/wiki/Retrieval-augmented_generation)，这是一种让模型在生成响应时，从外部知识库中检索相关信息的方法。

最简单的是向量嵌入搜索，把一句话通过向量模型映射到一个多维向量上，然后在向量空间中查找最相似的句子。

在查找最相似时，可以使用余弦相似度（Cosine Similarity）的计算方法。

$$ \operatorname{Similarity} = \hat{\mathbf{q}} \cdot \hat{\mathbf{d}} = \sum_{i=1}^{n} \hat q_i \hat d_i $$

将计算出来相似度归一化，之后排序。

在真实系统中，我们一般用混合搜索，也就是将向量搜索和关键词搜索结合起来。

> 更多关于 Memory 的探究，你可以参考
> [OpenClaw 的 Memory 设计](https://docs.openclaw.ai/concepts/memory).

### 技能 Skills

技能更像基于文件系统的知识库。

一个 Skill 一般存储在文件系统，它目录结构可能是这样的：

```bash
my-skill $ tree

my-skill/
	SKILL.md

	scripts/
	templates/
	examples/
	assets/
```

Skills 表明了怎么做事，比如：

- 如何写某类测试
- 如何调用某个内部规范
- 如何按照团队约定生成代码

我们一般会把 Skills 的标题和描述提取出来，注入到 System Prompt 中。

> Skills 是 Anthropic 提出的，具体请看
> [Agent Skills 概述](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview).

### 执行 Bash

执行工具是 Agent 真正开始接触外部世界的地方。

一个最基础的执行工具就是 Bash 工具，他可以执行 Shell 命令，它允许了 Agent
和真实环境的连接起来。

> 在 ClawLess 中，我们使用 @vercel/sandbox 来实现 Bash 工具。

Bash 风险最高，也最需要隔离，要特别考虑工具审核和沙箱环境的隔离。

> 如果你在寻找 ServerLess 的 Bash 工具或者是需要一个沙箱 Bash
> 工具，你可以考虑看看我们的 [AI SDK X](https://github.com/Niapya/ai-sdk-x).

### 任务

在处理复杂的任务时，我们还需要考虑更多。

#### 延时与定时任务

延时任务会在一定时间之后提醒你。

ClawLess 在 Workflow 内部使用 `sleep` 函数来实现延时任务。

```ts
import { sleep } from "workflow";

export async function remindTomorrow(taskId: string) {
  "use workflow";

  await sleep("1 day");
  await sendReminder(taskId);
}
```

定时任务又称作 Cron Job，它可以让你在指定的时间点执行任务。

定时任务的实现与延时任务相似，我们使用一个 `while (true)` 循环来实现定时任务。

```ts
while (true) {
  await sleep("1 day");
  runTask();
}
```

#### 子任务 Sub-Agent

子任务不一定非要是另一个完整 Agent，他会把一部分小的任务委托出去。

例如主 Agent 负责和用户对话，但某个研究问题可以单独交给一个更便宜的小模型。

一个最小的 Sub-Agent 实现可以是这样的。

```ts
import { generateText, tool } from "ai";
import { z } from "zod";

const delegateResearch = tool({
  description: "Hand off a focused research subtask",
  inputSchema: z.object({
    question: z.string(),
  }),
  execute: async ({ question }) => {
    const result = await generateText({
      model: "openai/gpt-4.1-mini",
      prompt: "Answer briefly and return only key facts:\n" + question,
    });

    return { summary: result.text };
  },
});
```

### MCP 与其他工具

模型上下文协议 (MCP, Model Context Protocol) 是一个统一的协议，他让 Agent
统一接入外部系统的能力。

如果你在做一个特定领域的 Agent，往往更适合 MCP，而不是一堆 Skills。

ClawLess 其实并没有做网页搜索（Web Search），浏览器访问（Browser
User）等功能，我们可以通过 MCP 来接入这些能力。

## 与前端连接

与 Agent 交互的前端部分，我们可以通过网页，Bot 或是其他地方与 Agent 链接。

### 网页对话

我们刚才的 `useChat` Hooks 就是最简单的网页对话部分，我们在这里不再叙述。

### 通过 Webhook 与 IM 连接

大部分即时通讯软件一般会有内置 Bot 的能力，例如 Telegram 、Discord 等。

Bot 大部分只有两种接收消息的方法：长轮询和 Webhook。

长轮询意味着 Bot
需要每隔一段时间（我们称之为心跳周期），向服务器请求最新消息，OpenClaw
的大部分连接器就是这么做的。

Webhook 则是一种更高效的方式，它允许服务器在有新消息时立即通知 Bot，而不需要 Bot
主动请求。

在 ClawLess 内部使用 [Chat SDK](https://chat-sdk.dev) 来通过 WebHook 连接各个
IM。

Chat SDK 特别简单，只需要你创建一个 Chat 实例。

```ts
// Next: lib/bot.ts
import { Chat } from "chat";

const bot = new Chat({
  userName: "mybot",
  adapters: { slack },
  state: createRedisState(),
});

bot.onNewMention(async (thread, message) => {
  await agent.handleMessage(message);
});
```

然后暴露一个适用于 WebHook 的 API 端口。

```ts
// Next: app/api/webhooks/slack/route.ts
export const POST = bot.webhooks.slack;
```

## 最后

看到这里，你会发现构建 Agent 的思路其实很简单。

我们特别希望看到你搭配这些，构建自己的 Agent，这真的特别有意思。

另外，我们在构建一个通用的沙盒虚拟 Bash，它适合任何一个 JS Runtime 的环境，以及
ServerLess 和嵌入式，如果你想了解，可以看看我们的
[AI-SDK-X 文档](https://niapya.github.io/ai-sdk-x/).
