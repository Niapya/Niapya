---
title: How to Build a Serverless Agent
language: en
generated: true
summary: >-
  Serverless platforms are a natural fit for AI agents because they only need to
  run when a request arrives, allowing cheap, always‑on‑free deployments; Vercel
  Workflow provides the long‑running, stateful orchestration required for such
  on‑demand agents. By leveraging Workflow’s `use workflow`/`use step`
  directives, hooks for Human‑in‑the‑Loop interactions, and the Vercel AI SDK,
  ClawLess demonstrates how to build a durable, interactive agent that handles
  messages, tool approvals, delayed tasks, and context management (compression
  and pruning) without a resident process. The article concludes that assembling
  these components makes creating functional, serverless agents straightforward
  and invites developers to extend the approach with custom tools and sandboxed
  execution.
createdAt: '2026-07-27T03:25:00.000Z'
updatedAt: '2026-07-27T04:10:00.000Z'
---

In early April, we open‑sourced the Serverless project
[ClawLess](https://github.com/Niapya/clawless), which can deploy a lightweight
Agent that is available 24 hours for free on your Vercel account.

This article records the trade‑offs behind ClawLess: why it should be
Serverless, and how we assembled a working Agent using Vercel Workflow,
Vercel AI SDK, Vercel Sandbox, KV, Blob, and Postgres Vector.

## Motivation

**Building a complete, long‑running Agent runtime costs not the model,
but the always‑on part.**

You can pick a cheap or free model, but you still need your own server,
VPS, or a constantly‑online Mac mini.

Some projects have offered a different solution: rewrite the runtime in a
smaller native language, push memory usage down, and run it on a Raspberry Pi,
development board, or another cheap Linux device.

Those solutions still need a device that stays online to run the Agent,
maintain its state, wait for user messages, and handle scheduled jobs, and
ClawLess was never intended for that approach.

For most people, the most common entry point for an Agent is still a
chatbot: the user sends a message, the Agent reads context, calls tools,
and returns a result. It does not need to run on the CPU every second;
it only needs to reliably handle a request when it is woken up.

We only need to process a request when a conversation arrives:

- If it’s on the web, that’s an API request triggered when the user sends a
  message.
- If it’s connected to your IM, that’s a webhook triggered when the IM
  receives a request (or it could be an API request).

In addition, we need delayed and scheduled tasks, e.g. “remind me tomorrow
to continue this topic” or “every morning summarize a channel”. These
tasks don’t require a resident process; they only need the platform to pause
a workflow, wait, and resume at the appropriate time.

Old friends know I’m a fan of Serverless. Its core idea is: start when a
request arrives, sleep while a task is pending, and wake up again when the
time comes.

Because of this characteristic, Serverless platforms can be deployed at
very low cost, especially for JS runtimes such as AWS Lambda, Vercel,
Cloudflare Workers, and many of them have generous free tiers.

After some research, I settled on Vercel Workflow. It can start long‑running
tasks, wait inside a workflow, and resume later, so ClawLess can be woken
by messages, webhooks, tool approvals, and schedules.

In other words, ClawLess does **not** need to run continuously; it only
needs to be invoked on demand. That’s exactly what a Workflow‑style
runtime excels at.

## Design

Since it has both front‑end and back‑end, this is a full‑stack project.

For full‑stack we have tried Nuxt or Hono‑SSR approaches, but we chose
Next.js as the framework because we need to use the Vercel Workflow API to
build the Agent, and Next.js is the native framework for Vercel Workflow.

## Workflow as the Agent Runtime

First, a quick intro to Vercel Workflow, Vercel’s newly released official,
long‑running, stateful process framework. In our tests a workflow can run
for at least 10 minutes.

> When we built ClawLess, Vercel Workflow was still in beta, but the API is
> now stable.

It uses `"use workflow";` and `"use step";` directives to define a workflow.

- `use workflow` handles **orchestration** – cross‑step state, waiting,
  resuming, and the overall flow.
- `use step` handles **execution** – individual retryable, side‑effect‑heavy
  atomic operations.

For an Agent, the logic that actually talks to a database, third‑party API,
or Sandbox command usually lives in a `step`; waiting for a user message,
waiting for approval, or waiting until 9 am tomorrow belongs in the
`workflow` layer.

An example workflow:

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

For AI, the most popular TypeScript framework is the Vercel AI SDK.

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

On the front‑end you can use the
[`useChat`](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat) hook to
easily build a chat UI.

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

> `useChat` hooks also have Vue, Svelte, and Angular libraries.

That gives a perfectly usable Web Chat, but it’s not yet a **Durable
Agent** because the runtime ends when the request finishes.

Our Agent needs to keep running after a request ends and persist its state.

So our workflow is equipped with an AI module that is deeply integrated
with the AI SDK and provides a `DurableAgent` suited for workflow
scenarios.

`Workflow.getWritable()` returns a persistent writable stream; the client
can disconnect and later reconnect to receive the rest of the output.

A simplified illustration:

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

Now the Agent truly behaves like an autonomous system.

> In ClawLess the process is more involved: the main workflow reads the
> current configuration from KV, builds a system prompt, loads tools from MCP,
> creates a `DurableAgent`, writes output to the UI message stream (and
> persists it), and finally saves state to Postgres SQL.

## Hook Makes the Workflow Truly Interactive

Consider the case where a user continues to send messages on the web, or
an IM webhook delivers more messages while the workflow is still running.
We should **follow‑up** with the existing Agent instead of spawning a brand‑new
workflow each time.

> This is the basic logic of Human‑in‑the‑Loop (HITL). For more details see
> Wikipedia’s [Human‑in‑the‑Loop](https://en.wikipedia.org/wiki/Human-in-the-loop).

Fortunately, Workflow provides **hooks** that enable this pattern.
A hook lets a running workflow pause at a certain point, wait for an
external event, and then resume.

The simplest external event is “the next user message”:

```ts
import { defineHook } from "workflow";

// Define a hook that receives an external event (the next user message)
export const messageHook = defineHook<{
  text: string;
  userId: string;
}>();

export async function conversation(sessionId: string) {
  "use workflow";

  const events = messageHook.create({
    token: "chat-" + sessionId,
  });

  // Wait for external events (the next user message)
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

The same mechanism works well for tool approvals. For example, when the
model wants to execute a high‑risk command—delete a file, send a message,
place an order, transfer money—we should not run it directly. Instead we
throw an approval request to the front‑end and wait for user confirmation.

> See the AI SDK documentation on
> [Tool Execution Approval](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling#tool-execution-approval).

Using workflow hooks means you don’t have to poll a database or write a
complex state machine; the workflow suspends while waiting and resumes
from the same state.

So the typical Agent workflow looks like this:

1. A user message hits the entry point.
2. The entry point checks whether the current session already has an
   active workflow.
3. If it does, the new message is sent back via a hook.
4. If not, a new workflow is created from scratch.

## Context

Agents have a **context limit**. Token‑counting differs between models, but
they all share one constraint: you must fit the system prompt, history,
tool results, file inputs, and memory into the context window.

Moreover, as the context grows, model accuracy degrades and costs rise.

Two common approaches for handling long context are **compression** and
**pruning**.

### Compression

Compression rewrites “very long but still needed” history into a shorter
representation. A typical pattern is: once a conversation reaches a
certain length, ask the model to summarize early dialogue, key tool results,
and confirmed user preferences, then remove the original messages from the
current window.

On the next real model call you prepend the summary.

> If you want more control, you can use a sliding‑window approach that
> includes the summary plus the most recent rounds and the current input.

```ts
import { generateText, type ModelMessage } from "ai";

export async function compactMessages(messages: ModelMessage[]) {
  const summary = await generateText({
    model,
    messages: [
      ...messages,
      {
        role: "user",
        content: "Please summarize our previous conversation and extract the key information that will help later.",
      },
    ],
  });

  return {
    summary: summary.text,
    recentMessages: messages.slice(-8),
  };
}
```

In a Workflow this is natural because the workflow already has its own
lifecycle and external storage. After a round finishes you can write the
summary to KV, delete the old messages, and keep only a “session summary”
field. The durable session persists, but the context fed to the model does
not grow indefinitely.

### Pruning

Pruning does not try to understand the history; it simply cuts away parts
that are unlikely to help the current round.

The AI SDK already provides `pruneMessages`, which can strip old reasoning,
tool call results, approval traces, and empty messages before sending
the payload to the model.

```ts
import { type ModelMessage, pruneMessages } from "ai";

export function buildContextWindow(messages: ModelMessage[]) {
  const pruned = pruneMessages({
    messages,
    reasoning: "before-last-message",
    toolCalls: "before-last-2-messages",
    emptyMessages: "remove",
  });

  const pinned = pruned.filter((m) => m.role === "system");
  const recent = pruned.filter((m) => m.role !== "system").slice(-12);

  return [...pinned, ...recent];
}
```

For Workflow‑based AI you typically call `prepareStep` before each model
invocation to rewrite the window.

```ts
const result = await agent.stream({
  messages,
  writable,

  // prepareStep runs before each model call to reshape the context window
  prepareStep: async ({ messages: currentMessages }) => {
    return {
      messages: buildContextWindow(currentMessages),
    };
  },
});
```

Compression and pruning are not mutually exclusive; most production
systems combine them according to design needs.

> This is the idea of **Context Engineering** – see Anthropic’s article
> [Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents).

Beyond that, we also need cross‑conversation, cross‑knowledge, or permanent
shared context. For those cases we store data in external systems via
tools rather than stuffing everything into the model’s context.

## Tools

**An Agent’s tools define its capability boundary.**

Without tools it is just a chat model; with tools it can store memory,
execute commands, learn skills, schedule tasks, or delegate work to sub‑Agents.

In the AI SDK, tools are first‑class citizens. A minimal tool definition looks
like this:

```ts
import { tool } from "ai";
import { z } from "zod";

const tools = {
  remember: tool({
    description: "Save a useful fact into long‑term memory",
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

### Memory

Memory stores long‑term facts and user preferences.

You can keep it in KV, a database, or as files in Blob, and expose tools for
the model to manage it.

For search, full‑text keyword search is convenient but has limits; two
sentences may be highly related without sharing any words.

Consider **RAG (Retrieval‑Augmented Generation)** – letting the model
retrieve relevant information from an external knowledge base while
generating a response.

The simplest approach is vector‑embedding search: encode a sentence into a
multi‑dimensional vector and find the most similar vectors in the space.
Cosine similarity is a common metric:

$$ \operatorname{Similarity} = \hat{\mathbf{q}} \cdot \hat{\mathbf{d}} = \sum_{i=1}^{n} \hat q_i \hat d_i $$

Normalize the similarity scores and sort.

In production we usually combine vector search with keyword search (hybrid
search).

> For a deeper dive into Memory, see
> [OpenClaw’s Memory design](https://docs.openclaw.ai/concepts/memory).

### Skills

Skills are more like file‑system‑based knowledge bases.

A Skill typically lives in a directory structure such as:

```bash
my-skill $ tree

my-skill/
    SKILL.md

    scripts/
    templates/
    examples/
    assets/
```

Skills describe **how** to do things, for example:

- How to write a certain type of test
- How to invoke an internal specification
- How to generate code according to team conventions

We usually extract a Skill’s title and description and inject them into the
System Prompt.

> Skills were introduced by Anthropic; see
> [Agent Skills Overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview).

### Execute Bash

Execution tools let the Agent actually interact with the outside world.

The most basic execution tool is a Bash tool that runs shell commands,
bridging the Agent to a real environment.

> In ClawLess we use `@vercel/sandbox` to implement the Bash tool.

Bash is the highest‑risk tool and requires strong isolation, careful
approval, and sandboxing.

> If you’re looking for a Serverless Bash tool or a sandboxed Bash
> implementation, check out our
> [AI SDK X](https://github.com/Niapya/ai-sdk-x).

### Tasks

When handling complex work we need to consider more categories.

#### Delayed and Scheduled Tasks

A delayed task notifies you after a certain amount of time.

ClawLess implements delayed tasks inside a Workflow using the `sleep`
function.

```ts
import { sleep } from "workflow";

export async function remindTomorrow(taskId: string) {
  "use workflow";

  await sleep("1 day");
  await sendReminder(taskId);
}
```

A scheduled task (Cron Job) runs at a specific time repeatedly.

Implementation is similar; we use an infinite loop with `sleep`.

```ts
while (true) {
  await sleep("1 day");
  runTask();
}
```

#### Sub‑Agents

A sub‑task does not have to be a full‑blown Agent; it can delegate a small
piece of work.

For example, the main Agent handles the conversation, but a specific
research question could be handed to a cheaper, smaller model.

A minimal Sub‑Agent implementation:

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

### MCP and Other Tools

The Model Context Protocol (MCP) is a unified protocol that lets an Agent
connect to external systems in a standardized way.

If you are building a domain‑specific Agent, MCP is often a better fit than a
handful of ad‑hoc Skills.

ClawLess does not implement web search, browser navigation, etc., directly;
instead we can plug those capabilities in via MCP.

## Connecting to the Frontend

The front‑end that interacts with the Agent can be a web page, a Bot, or
any other client.

### Web Chat

The `useChat` hook we showed earlier is the simplest web‑chat solution;
we won’t repeat it here.

### Connecting to IM via Webhook

Most instant‑messaging platforms expose Bot capabilities (e.g., Telegram,
Discord).

Bots typically receive messages either via **long polling** or **webhooks**.

Long polling means the Bot periodically (the “heartbeat”) asks the server
for new messages; OpenClaw’s connectors work this way.

Webhooks are more efficient: the server pushes a new‑message notification
to the Bot without the Bot having to request.

ClawLess uses the [Chat SDK](https://chat-sdk.dev) to connect to various IMs
via webhook.

The Chat SDK is straightforward: create a `Chat` instance.

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

Then expose an API route that handles the webhook.

```ts
// Next: app/api/webhooks/slack/route.ts
export const POST = bot.webhooks.slack;
```

## Conclusion

By now you should see that building an Agent can be surprisingly simple.

We hope you combine these pieces to create your own Agents—it’s genuinely
fun.

We are also building a universal sandboxed Bash that works in any JS Runtime,
Serverless or embedded environments. If you’re interested, check out our
[AI‑SDK‑X documentation](https://niapya.github.io/ai-sdk-x/).
