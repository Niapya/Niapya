const color = (variable) => `var(--${variable})`;

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
};

module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./public/**/*.{html,svg}"],
  darkMode: "media",
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
