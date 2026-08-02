import assert from "node:assert/strict";

import { configure, type LogRecord, reset } from "@logtape/logtape";

import { handleRequest } from "./log.ts";

const records: LogRecord[] = [];

await configure({
  reset: true,
  sinks: {
    test: (record) => records.push(record),
  },
  loggers: [
    {
      category: ["niapya"],
      lowestLevel: "info",
      sinks: ["test"],
    },
    {
      category: ["logtape", "meta"],
      lowestLevel: "fatal",
      sinks: [],
    },
  ],
});

Deno.test("handleRequest logs responses and handles unexpected errors", async () => {
  const request = new Request("https://niapya.test/work?token=secret");

  const success = await handleRequest(request, () =>
    new Response(null, {
      status: 204,
    }));

  assert.equal(success.status, 204);
  assert.equal(records.length, 2);
  assert.equal(records[0]?.level, "info");
  assert.equal(records[1]?.level, "info");
  assert.equal(records[1]?.properties.method, "GET");
  assert.equal(records[1]?.properties.path, "/work");
  assert.equal("token" in (records[1]?.properties ?? {}), false);

  records.length = 0;
  await handleRequest(
    request,
    () => new Response("Not Found", { status: 404 }),
  );
  assert.equal(records[1]?.level, "warning");

  records.length = 0;
  const failure = new Error("database unavailable");
  const response = await handleRequest(request, () => {
    throw failure;
  });

  assert.equal(response.status, 500);
  assert.equal(await response.text(), "Internal Server Error");
  assert.equal(records[1]?.level, "error");
  assert.equal(records[1]?.properties.error, failure);

  await reset();
});
