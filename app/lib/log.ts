import { isLocalDevelopment } from "@/constants/index.ts";

type ConsoleArguments = Parameters<typeof console.log>;

const prefix = "[main]";

export const log = {
  debug(...args: ConsoleArguments): void {
    if (isLocalDevelopment) console.debug(prefix, ...args);
  },

  info(...args: ConsoleArguments): void {
    if (isLocalDevelopment) console.info(prefix, ...args);
  },

  warn(...args: ConsoleArguments): void {
    console.warn(prefix, ...args);
  },

  error(...args: ConsoleArguments): void {
    console.error(prefix, ...args);
  },
};
