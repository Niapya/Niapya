import { IS_DEVELOPMENT } from "@/constants/index.ts";

type ConsoleArguments = Parameters<typeof console.log>;

const prefix = "[main]";

function format(level: string, ...args: ConsoleArguments): unknown[] {
  return [
    prefix,
    `[${new Date().toISOString()}]`,
    `[${level}]`,
    ...args,
  ];
}

export const log = {
  debug(...args: ConsoleArguments): void {
    if (IS_DEVELOPMENT) console.debug(...format("DEBUG", ...args));
  },

  info(...args: ConsoleArguments): void {
    if (IS_DEVELOPMENT) console.info(...format("INFO", ...args));
  },

  warn(...args: ConsoleArguments): void {
    console.warn(...format("WARN", ...args));
  },

  error(...args: ConsoleArguments): void {
    console.error(...format("ERROR", ...args));
  },
};
