import assert from "node:assert/strict";
import { createRouter } from "remix/router";

import { twind } from "./twind.ts";

Deno.test("twind inlines preset CSS into streamed HTML", async () => {
  const router = createRouter({ middleware: [twind()] });
  const source = new TextEncoder().encode(
    '<!doctype html><html><head><title>Test</title></head><body><main class="flex select-none">你好</main></body></html>',
  );

  router.get(
    "/",
    () =>
      new Response(streamChunks(source, source.indexOf(0xe4) + 1), {
        status: 201,
        statusText: "Created",
        headers: {
          "Content-Length": String(source.length),
          "Content-Type": "text/html; charset=utf-8",
          "X-Test": "preserved",
        },
      }),
  );

  const response = await router.fetch("http://localhost/");
  const html = await response.text();

  assert.equal(response.status, 201);
  assert.equal(response.statusText, "Created");
  assert.equal(response.headers.get("Content-Length"), null);
  assert.equal(response.headers.get("X-Test"), "preserved");
  assert.match(html, /<style data-twind>.*\.flex\{/s);
  assert.match(html, /user-select:none/);
  assert.match(html, /<\/style><\/head>/);
  assert.match(html, />你好<\/main>/);
  assert.doesNotMatch(html, /<script/);
});

Deno.test("twind leaves non-HTML responses untouched", async () => {
  const router = createRouter({ middleware: [twind()] });

  router.get("/", () =>
    Response.json({ class: "flex" }, {
      headers: { "Content-Length": "16" },
    }));

  const response = await router.fetch("http://localhost/");

  assert.equal(response.headers.get("Content-Length"), "16");
  assert.deepEqual(await response.json(), { class: "flex" });
});

Deno.test("twind streams the shell and patches CSS for later chunks", async () => {
  const encoder = new TextEncoder();
  let source!: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      source = controller;
    },
  });
  const router = createRouter({ middleware: [twind()] });

  router.get("/", () =>
    new Response(body, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }));

  const response = await router.fetch("http://localhost/");
  const reader = response.body!.getReader();
  source.enqueue(encoder.encode(
    '<html><head></head><body><main class="flex"></main></body></html><!-- rmx:flush document -->',
  ));

  const firstRead = reader.read();
  const shellWasStreamed = await settlesWithin(firstRead, 100);

  if (!shellWasStreamed) {
    source.close();
    await firstRead;
  }

  assert.equal(shellWasStreamed, true);

  const shell = new TextDecoder().decode((await firstRead).value);
  assert.match(shell, /<style data-twind>.*\.flex\{/s);

  const patchRead = reader.read();
  source.enqueue(encoder.encode('<template id="frame"><div class="gr'));
  assert.equal(await settlesWithin(patchRead, 50), false);
  source.enqueue(encoder.encode('id"></div></template>'));
  assert.equal(await settlesWithin(patchRead, 100), true);

  const patch = new TextDecoder().decode((await patchRead).value);
  assert.match(patch, /^<script>!function/);
  assert.match(patch, /\.grid\{[^}]*display:grid\}/);
  assert.match(
    patch,
    /<template id="frame"><div class="grid"><\/div><\/template>/,
  );

  source.close();
  assert.equal((await reader.read()).done, true);
});

Deno.test("twind isolates interleaved HTML stream state", async () => {
  const encoder = new TextEncoder();
  const streamA = createControlledStream();
  const streamB = createControlledStream();
  const router = createRouter({ middleware: [twind()] });

  router.get("/a", () => htmlResponse(streamA.body));
  router.get("/b", () => htmlResponse(streamB.body));

  const responseA = await router.fetch("http://localhost/a");
  const responseB = await router.fetch("http://localhost/b");
  const readerA = responseA.body!.getReader();
  const readerB = responseB.body!.getReader();

  streamA.controller.enqueue(encoder.encode(documentChunk("flex")));
  assert.match(await readText(readerA), /\.flex\{/);

  streamB.controller.enqueue(encoder.encode(documentChunk("block")));
  assert.match(await readText(readerB), /\.block\{/);

  streamA.controller.enqueue(encoder.encode(frameChunk("grid")));
  const patchA = await readText(readerA);
  assert.match(patchA, /\.grid\{/);
  assert.doesNotMatch(patchA, /\.underline\{/);

  streamB.controller.enqueue(encoder.encode(frameChunk("underline")));
  const patchB = await readText(readerB);
  assert.match(patchB, /\.underline\{/);
  assert.doesNotMatch(patchB, /\.grid\{/);

  streamA.controller.close();
  streamB.controller.close();
  assert.equal((await readerA.read()).done, true);
  assert.equal((await readerB.read()).done, true);
});

function streamChunks(
  bytes: Uint8Array,
  offset: number,
): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(bytes.slice(0, offset));
      controller.enqueue(bytes.slice(offset));
      controller.close();
    },
  });
}

async function settlesWithin<T>(promise: Promise<T>, milliseconds: number) {
  return await Promise.race([
    promise.then(() => true),
    new Promise<false>((resolve) =>
      setTimeout(() => resolve(false), milliseconds)
    ),
  ]);
}

function createControlledStream() {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({
    start(value) {
      controller = value;
    },
  });
  return { body, controller };
}

function htmlResponse(body: ReadableStream<Uint8Array>): Response {
  return new Response(body, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function documentChunk(className: string): string {
  return `<html><head></head><body><main class="${className}"></main></body></html><!-- rmx:flush document -->`;
}

function frameChunk(className: string): string {
  return `<template><div class="${className}"></div></template>`;
}

async function readText(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): Promise<string> {
  const result = await reader.read();
  assert.equal(result.done, false);
  return new TextDecoder().decode(result.value);
}
