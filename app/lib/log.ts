import { configure, getConsoleSink } from "@logtape/logtape";

const isDevelopment = Deno.env.get("NODE_ENV") === "development";

await configure({
  sinks: {
    console: getConsoleSink(),
  },
  loggers: [
    {
      category: ["niapya"],
      lowestLevel: isDevelopment ? "info" : "warning",
      sinks: ["console"],
    },
    {
      category: ["logtape", "meta"],
      lowestLevel: "warning",
      sinks: ["console"],
    },
  ],
});
