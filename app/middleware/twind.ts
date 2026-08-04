import { IS_PRODUCTION } from "@/constants/index.ts";
import {
  consume,
  type CSSBase,
  identity,
  type InlineOptions,
  install,
  noop,
  stringify,
  tw as managedTw,
} from "@twind/core";
import presetAutoprefix from "@twind/preset-autoprefix";
import presetTailwind from "@twind/preset-tailwind";
import presetTypography from "@twind/preset-typography";
import diff from "fast-diff";
import type { Middleware } from "remix/router";

const color = (variable: string) => `var(--${variable})`;

const darkThemeVariables = {
  colorScheme: "dark",
  "--background": "oklch(0.145 0 0)",
  "--foreground": "oklch(0.985 0 0)",
  "--card": "oklch(0.205 0 0)",
  "--card-foreground": "oklch(0.985 0 0)",
  "--popover": "oklch(0.205 0 0)",
  "--popover-foreground": "oklch(0.985 0 0)",
  "--primary": "#60a5fa",
  "--primary-foreground": "#172554",
  "--secondary": "oklch(0.274 0.006 286.033)",
  "--secondary-foreground": "oklch(0.985 0 0)",
  "--muted": "oklch(0.269 0 0)",
  "--muted-foreground": "oklch(0.708 0 0)",
  "--accent": "oklch(0.269 0 0)",
  "--accent-foreground": "oklch(0.985 0 0)",
  "--destructive": "oklch(0.704 0.191 22.216)",
  "--border": "oklch(1 0 0 / 10%)",
  "--input": "oklch(1 0 0 / 15%)",
  "--ring": "oklch(0.556 0 0)",
  "--chart-1": "oklch(0.809 0.105 251.813)",
  "--chart-2": "oklch(0.623 0.214 259.815)",
  "--chart-3": "oklch(0.546 0.245 262.881)",
  "--chart-4": "oklch(0.488 0.243 264.376)",
  "--chart-5": "oklch(0.424 0.199 265.638)",
  "--sidebar": "oklch(0.205 0 0)",
  "--sidebar-foreground": "oklch(0.985 0 0)",
  "--sidebar-primary": "oklch(0.623 0.214 259.815)",
  "--sidebar-primary-foreground": "oklch(0.97 0.014 254.604)",
  "--sidebar-accent": "oklch(0.269 0 0)",
  "--sidebar-accent-foreground": "oklch(0.985 0 0)",
  "--sidebar-border": "oklch(1 0 0 / 10%)",
  "--sidebar-ring": "oklch(0.556 0 0)",
} as const;

const colors = {
  border: color("border"),
  input: color("input"),
  ring: color("ring"),
  background: color("background"),
  foreground: color("foreground"),
  primary: {
    DEFAULT: color("primary"),
    foreground: color("primary-foreground"),
  },
  secondary: {
    DEFAULT: color("secondary"),
    foreground: color("secondary-foreground"),
  },
  destructive: {
    DEFAULT: color("destructive"),
    foreground: color("destructive-foreground"),
  },
  muted: {
    DEFAULT: color("muted"),
    foreground: color("muted-foreground"),
  },
  accent: {
    DEFAULT: color("accent"),
    foreground: color("accent-foreground"),
  },
  popover: {
    DEFAULT: color("popover"),
    foreground: color("popover-foreground"),
  },
  card: {
    DEFAULT: color("card"),
    foreground: color("card-foreground"),
  },
  sidebar: {
    DEFAULT: color("sidebar"),
    foreground: color("sidebar-foreground"),
    primary: color("sidebar-primary"),
    "primary-foreground": color("sidebar-primary-foreground"),
    accent: color("sidebar-accent"),
    "accent-foreground": color("sidebar-accent-foreground"),
    border: color("sidebar-border"),
    ring: color("sidebar-ring"),
  },
  chart: {
    1: color("chart-1"),
    2: color("chart-2"),
    3: color("chart-3"),
    4: color("chart-4"),
    5: color("chart-5"),
  },
} as const;

const themeVariables = {
  ":root": {
    colorScheme: "light",
    "--background": "oklch(1 0 0)",
    "--foreground": "oklch(0.145 0 0)",
    "--card": "oklch(1 0 0)",
    "--card-foreground": "oklch(0.145 0 0)",
    "--popover": "oklch(1 0 0)",
    "--popover-foreground": "oklch(0.145 0 0)",
    "--primary": "oklch(0.488 0.243 264.376)",
    "--primary-foreground": "oklch(0.97 0.014 254.604)",
    "--secondary": "oklch(0.967 0.001 286.375)",
    "--secondary-foreground": "oklch(0.21 0.006 285.885)",
    "--muted": "oklch(0.97 0 0)",
    "--muted-foreground": "oklch(0.556 0 0)",
    "--accent": "oklch(0.97 0 0)",
    "--accent-foreground": "oklch(0.205 0 0)",
    "--destructive": "oklch(0.577 0.245 27.325)",
    "--border": "oklch(0.922 0 0)",
    "--input": "oklch(0.922 0 0)",
    "--ring": "oklch(0.708 0 0)",
    "--chart-1": "oklch(0.809 0.105 251.813)",
    "--chart-2": "oklch(0.623 0.214 259.815)",
    "--chart-3": "oklch(0.546 0.245 262.881)",
    "--chart-4": "oklch(0.488 0.243 264.376)",
    "--chart-5": "oklch(0.424 0.199 265.638)",
    "--radius": "0.875rem",
    "--sidebar": "oklch(0.985 0 0)",
    "--sidebar-foreground": "oklch(0.145 0 0)",
    "--sidebar-primary": "oklch(0.546 0.245 262.881)",
    "--sidebar-primary-foreground": "oklch(0.97 0.014 254.604)",
    "--sidebar-accent": "oklch(0.97 0 0)",
    "--sidebar-accent-foreground": "oklch(0.205 0 0)",
    "--sidebar-border": "oklch(0.922 0 0)",
    "--sidebar-ring": "oklch(0.708 0 0)",
    "--font-sans":
      '"Instrument Sans", "Noto Sans SC", ui-sans-serif, system-ui, sans-serif',
    "--font-display":
      '"Instrument Serif", "Noto Serif SC", ui-serif, Georgia, serif',
    "--font-serif":
      '"Instrument Serif", "Noto Serif SC", ui-serif, Georgia, serif',
    "--font-mono":
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
  "@media (prefers-color-scheme: dark)": {
    ":root:not(.light)": darkThemeVariables,
  },
  "@view-transition": {
    navigation: "auto",
  },
  "@keyframes page-view-out": {
    to: {
      opacity: "0",
      transform: "translateY(-0.375rem)",
    },
  },
  "@keyframes page-view-in": {
    from: {
      opacity: "0",
      transform: "translateY(0.5rem)",
    },
  },
  "::view-transition-old(root)": {
    animation: "180ms cubic-bezier(0.4, 0, 1, 1) both page-view-out",
  },
  "::view-transition-new(root)": {
    animation: "240ms cubic-bezier(0, 0, 0.2, 1) both page-view-in",
  },
  "@media (prefers-reduced-motion: reduce)": {
    "::view-transition-old(root), ::view-transition-new(root)": {
      animationDuration: "0.01ms",
    },
  },
  "@supports not selector(::-webkit-scrollbar)": {
    html: {
      scrollbarColor:
        "color-mix(in oklab, black 38%, var(--muted)) var(--muted)",
      scrollbarWidth: "auto",
    },
  },
  "@supports selector(::-webkit-scrollbar)": {
    "html::-webkit-scrollbar": {
      width: "1.5rem",
      background: "var(--background)",
    },
    "html::-webkit-scrollbar-button": {
      display: "none",
    },
    "html::-webkit-scrollbar-track": {
      marginBlock: "0.5rem",
      background: "var(--background)",
    },
    "html::-webkit-scrollbar-track-piece": {
      borderInline: "0.375rem solid transparent",
      backgroundClip: "padding-box",
    },
    "html::-webkit-scrollbar-track-piece:start": {
      backgroundColor: "color-mix(in oklab, black 38%, var(--muted))",
    },
    "html::-webkit-scrollbar-track-piece:end": {
      backgroundColor: "var(--muted)",
    },
    "html::-webkit-scrollbar-thumb": {
      minHeight: "0.75rem",
      borderRadius: "999rem",
      background:
        "radial-gradient(circle at center, black 0 0.375rem, transparent 0.4rem), linear-gradient(to bottom, color-mix(in oklab, black 38%, var(--muted)) 0 50%, var(--muted) 50% 100%) center / 0.75rem 100% no-repeat",
    },
    "html::-webkit-scrollbar-corner": {
      background: "var(--background)",
    },
  },
  ".dark": {
    ...darkThemeVariables,
  },
  html: {
    overscrollBehavior: "none",
    scrollBehavior: "smooth",
  },
  "*, ::before, ::after": {
    borderColor: "var(--border)",
  },
  body: {
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
    fontFamily: "var(--font-sans)",
    overscrollBehavior: "none",
  },
} as const satisfies CSSBase;

const twindConfig = {
  presets: [presetAutoprefix(), presetTailwind(), presetTypography()],
  darkMode: "media",
  preflight: [themeVariables],
  theme: {
    extend: {
      colors,
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        26: "6.5rem",
        30: "7.5rem",
      },
      maxWidth: {
        "8xl": "90rem",
      },
      boxShadow: {
        xs: "0 1px 2px color-mix(in oklab, var(--foreground) 4%, transparent)",
        sm:
          "0 1px 3px color-mix(in oklab, var(--foreground) 8%, transparent), 0 1px 2px color-mix(in oklab, var(--foreground) 4%, transparent)",
        md: "0 4px 12px color-mix(in oklab, var(--foreground) 8%, transparent)",
        lg:
          "0 12px 32px color-mix(in oklab, var(--foreground) 12%, transparent)",
      },
    },
  },
};

export const tw = install(twindConfig, IS_PRODUCTION);

const encoder = new TextEncoder();

export function twind(): Middleware {
  return async ({ request }, next) => {
    const response = await next();

    if (!response.body || !isHtml(response.headers.get("Content-Type"))) {
      return response;
    }

    const headers = new Headers(response.headers);
    headers.delete("Content-Length");

    return new Response(
      response.body.pipeThrough(new TwindStream(), {
        signal: request.signal,
      }),
      {
        status: response.status,
        statusText: response.statusText,
        headers,
      },
    );
  };
}

class TwindStream extends TransformStream<Uint8Array, Uint8Array> {
  constructor(options?: InlineOptions["tw"] | InlineOptions) {
    const state = createState(options);
    const decoder = new TextDecoder();

    const flushState: TransformerFlushCallback<Uint8Array> = (controller) => {
      const markup = state.flush();
      if (markup) controller.enqueue(encoder.encode(markup));
    };

    super({
      transform(chunk, controller) {
        if (state.push(decoder.decode(chunk, { stream: true }))) {
          flushState(controller);
        }
      },
      flush(controller) {
        const trailing = decoder.decode();
        if (trailing) state.push(trailing);
        flushState(controller);
      },
    });
  }
}

function createState(options: InlineOptions["tw"] | InlineOptions = {}) {
  const { tw = managedTw, minify = identity } = typeof options === "function"
    ? { tw: options }
    : options;

  let buffer = "";
  let lastStyle: string | null = null;
  let restoreCurrentState = noop;

  return {
    push(chunk: string): boolean {
      buffer += chunk;
      return lastStyle === null ? isShellReady(buffer) : isChunkReady(buffer);
    },

    flush(): string | undefined {
      if (!buffer) return;

      const restoreGlobalState = tw.snapshot();
      restoreCurrentState();

      let html = consume(buffer, tw);
      const nextStyle = minify(stringify(tw.target), html);

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

      buffer = "";
      lastStyle = nextStyle;
      return html;
    },
  };
}

function getStyleDiff(previous: string, next: string): [number, string][] {
  const changes: [number, string][] = [];
  let offset = 0;

  for (const [type, text] of diff(previous, next)) {
    if (type === 1) changes.push([offset, text]);
    offset += text.length;
  }

  return changes;
}

function createStylePatch(changes: [number, string][]): string {
  return `<script>!function(e,n){e&&(e.textContent=n.reduce((function(e,n){return e.slice(0,n[0])+n[1]+e.slice(n[0])}),e.textContent||''))}(document.querySelector('style[data-twind=""]'),${
    JSON.stringify(changes)
  })</script>`;
}

function isShellReady(markup: string): boolean {
  return hasFlushMarker(markup) ||
    /<\/body>\s*<\/html>\s*$/i.test(markup);
}

function isChunkReady(markup: string): boolean {
  return hasFlushMarker(markup) || /<\/template>\s*$/i.test(markup);
}

function hasFlushMarker(markup: string): boolean {
  return /<!--\s*rmx:flush\s+(?:document|fragment)\s*-->\s*$/.test(markup);
}

function isHtml(contentType: string | null): boolean {
  return contentType?.split(";", 1)[0].trim().toLowerCase() === "text/html";
}
