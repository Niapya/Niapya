import { css, type Handle } from "remix/ui";

import {
  createI18n,
  DEFAULT_LANG,
  type I18n,
  localizeHref,
} from "@/i18n/index.ts";
import { routes } from "@/routes.ts";
import { Icon } from "@/components/icon.tsx";
import { createDomId } from "@/utils/id.ts";
import { createUniqueSlugger } from "@/utils/slug.ts";

type Skill = {
  id: string;
  label: string;
  icon: { name: string; colorClass: string };
  motion: ReturnType<typeof css>;
};

type CommentsProps = {
  i18n?: I18n;
};

const SKILL_DEFINITIONS = [
  {
    label: "Vite",
    icon: { name: "simple-icons:vite", colorClass: "text-violet-600" },
  },
  {
    label: "React",
    icon: { name: "simple-icons:react", colorClass: "text-cyan-600" },
  },
  {
    label: "Vue",
    icon: { name: "simple-icons:vuedotjs", colorClass: "text-emerald-600" },
  },
  {
    label: "Nuxt.js",
    icon: { name: "simple-icons:nuxt", colorClass: "text-emerald-600" },
  },
  {
    label: "Next.js",
    icon: { name: "simple-icons:nextdotjs", colorClass: "text-black" },
  },
  {
    label: "Vercel",
    icon: { name: "simple-icons:vercel", colorClass: "text-black" },
  },
  {
    label: "Cloudflare",
    icon: { name: "simple-icons:cloudflare", colorClass: "text-orange-500" },
  },
  {
    label: "Serverless",
    icon: { name: "simple-icons:serverless", colorClass: "text-red-600" },
  },
  {
    label: "Node.js",
    icon: { name: "simple-icons:nodedotjs", colorClass: "text-green-600" },
  },
  {
    label: "npm",
    icon: { name: "simple-icons:npm", colorClass: "text-red-600" },
  },
  {
    label: "Svelte",
    icon: { name: "simple-icons:svelte", colorClass: "text-orange-600" },
  },
  {
    label: "Hono",
    icon: { name: "simple-icons:hono", colorClass: "text-orange-600" },
  },
  {
    label: "Redis",
    icon: { name: "simple-icons:redis", colorClass: "text-red-600" },
  },
  {
    label: "Drizzle ORM",
    icon: { name: "simple-icons:drizzle", colorClass: "text-lime-600" },
  },
  {
    label: "OpenAPI",
    icon: {
      name: "simple-icons:openapiinitiative",
      colorClass: "text-green-600",
    },
  },
  {
    label: "Python",
    icon: { name: "simple-icons:python", colorClass: "text-blue-600" },
  },
  {
    label: "SwiftUI",
    icon: { name: "simple-icons:swift", colorClass: "text-orange-600" },
  },
  {
    label: "Tauri",
    icon: { name: "simple-icons:tauri", colorClass: "text-cyan-600" },
  },
  {
    label: "TypeScript",
    icon: { name: "simple-icons:typescript", colorClass: "text-blue-600" },
  },
  {
    label: "Figma",
    icon: { name: "simple-icons:figma", colorClass: "text-red-500" },
  },
  {
    label: "Tailwind CSS",
    icon: { name: "simple-icons:tailwindcss", colorClass: "text-cyan-500" },
  },
] as const satisfies readonly Omit<Skill, "id" | "motion">[];

const blogSectionStyle = css(
  {
    height: "100dvh",
    minHeight: "44rem",
    viewTimelineName: "--blog-fan",
    viewTimelineAxis: "block",
    "& [data-skill-position]": {
      willChange: "transform, opacity",
    },
    "@media (prefers-reduced-motion: reduce)": {
      "& [data-skill-position]": { willChange: "auto" },
    },
  } as Parameters<typeof css>[0],
);

const blogContentStyle = css({
  insetBlockEnd: "8%",
});

export function Comments(handle: Handle<CommentsProps>) {
  return () => {
    const i18n = handle.props.i18n ?? createI18n(DEFAULT_LANG);
    const copy = i18n.messages.home.blogPreview;

    return (
      <section
        id="blog-preview"
        aria-labelledby="blog-preview-title"
        class="relative isolate overflow-hidden bg-black text-white"
        mix={blogSectionStyle}
      >
        <header class="absolute inset-x-0 top-0 z-30 mx-auto flex max-w-8xl select-none items-start justify-between gap-6 px-5 py-5 sm:px-10 sm:py-7 lg:px-16">
          {copy.tools && (
            <p class="font-mono text-white/70 text-xs uppercase">
              {copy.tools}
            </p>
          )}
          {copy.practice && (
            <p class="font-mono text-white/45 text-xs uppercase">
              {String(SKILLS.length).padStart(2, "0")} / {copy.practice}
            </p>
          )}
        </header>

        <ul
          aria-label={copy.orbitLabel}
          class="absolute inset-0 z-10 select-none"
        >
          {SKILLS.map((skill) => (
            <li
              key={skill.id}
              data-skill-position
              class="flex items-center justify-center"
              mix={skill.motion}
            >
              <div
                data-skill-tile
                role="img"
                aria-label={skill.label}
                class="flex h-9 w-9 transform-gpu select-none items-center justify-center rounded-sm border border-white/30 bg-white p-1.5 shadow-lg transition duration-500 ease-out hover:-translate-y-2 hover:scale-105 hover:border-white/70 hover:shadow-2xl motion-reduce:transition-none motion-reduce:hover:transform-none sm:h-12 sm:w-12 sm:p-2.5 lg:h-20 lg:w-20 lg:p-4"
                title={skill.label}
              >
                <Icon
                  name={skill.icon.name}
                  className={`block h-full w-full ${skill.icon.colorClass}`}
                />
              </div>
            </li>
          ))}
        </ul>

        <div
          class="absolute inset-x-0 z-20 mx-auto flex max-w-5xl flex-col items-center px-5 text-center sm:px-10"
          mix={blogContentStyle}
        >
          {copy.eyebrow && (
            <p class="mb-4 font-mono text-white/50 text-xs uppercase">
              {copy.eyebrow}
            </p>
          )}
          <h2 id="blog-preview-title">
            <a
              href={localizeHref(routes.blog.index.href(), i18n.lang)}
              class="group inline-flex cursor-pointer select-none items-start gap-2 font-display text-6xl text-white leading-none outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-8 focus-visible:ring-offset-black focus-visible:ring-white sm:gap-4 sm:text-8xl lg:text-9xl"
            >
              <span class="underline decoration-1 decoration-white/20 underline-offset-4 transition-colors group-hover:decoration-white group-focus-visible:decoration-white motion-reduce:transition-none">
                {copy.title}
              </span>
              <span
                aria-hidden="true"
                class="mt-1 transition-transform duration-500 ease-out group-hover:translate-x-1 group-hover:-translate-y-1 group-focus-visible:translate-x-1 group-focus-visible:-translate-y-1 motion-reduce:transition-none sm:mt-2"
              >
                <Icon
                  name="lucide:arrow-up-right"
                  className="h-7 w-7 sm:h-10 sm:w-10 lg:h-12 lg:w-12"
                />
              </span>
            </a>
          </h2>
          <p class="mt-6 max-w-xl text-base text-white/60 leading-7 sm:text-lg">
            {copy.description}
          </p>
        </div>
      </section>
    );
  };
}

const FAN_LAYOUT = [
  { desktop: [-10, -18], mobile: [-8, -14], rotation: -4 },
  { desktop: [5, -20], mobile: [5, -16], rotation: 7 },
  { desktop: [15, -23], mobile: [14, -19], rotation: -8 },
  { desktop: [-25, -29], mobile: [-22, -24], rotation: 11 },
  { desktop: [-13, -33], mobile: [-10, -28], rotation: -12 },
  { desktop: [0, -28], mobile: [0, -23], rotation: 5 },
  { desktop: [13, -35], mobile: [12, -30], rotation: -6 },
  { desktop: [26, -31], mobile: [23, -26], rotation: 13 },
  { desktop: [-36, -41], mobile: [-33, -34], rotation: -9 },
  { desktop: [-22, -45], mobile: [-20, -39], rotation: 6 },
  { desktop: [-8, -40], mobile: [-7, -34], rotation: -14 },
  { desktop: [7, -48], mobile: [7, -43], rotation: 9 },
  { desktop: [22, -42], mobile: [20, -36], rotation: -5 },
  { desktop: [36, -46], mobile: [33, -40], rotation: 12 },
  { desktop: [-39, -57], mobile: [-37, -48], rotation: -11 },
  { desktop: [-18, -55], mobile: [-17, -46], rotation: 8 },
  { desktop: [10, -59], mobile: [9, -50], rotation: -7 },
  { desktop: [37, -56], mobile: [36, -47], rotation: 4 },
  { desktop: [-43, -68], mobile: [-40, -57], rotation: -6 },
  { desktop: [-28, -65], mobile: [-27, -55], rotation: 10 },
  { desktop: [-2, -69], mobile: [-2, -58], rotation: -4 },
  { desktop: [24, -66], mobile: [24, -56], rotation: 7 },
] as const;

function createFanMotion(index: number) {
  const position = FAN_LAYOUT[index % FAN_LAYOUT.length];
  const animationName = `blog-fan-skill-${index}`;
  const rangeStart = 38 + index * 7 % 19;
  const rangeEnd = 58 + index * 5 % 13;
  const finalTransform =
    "translate3d(-50%, -50%, 0) translate3d(var(--fan-x), var(--fan-y), 0) rotate(var(--fan-rotation)) scale(1)";

  return css(
    {
      "--fan-x": `${position.desktop[0]}vw`,
      "--fan-y": `${position.desktop[1]}dvh`,
      "--fan-rotation": `${position.rotation}deg`,
      position: "absolute",
      insetInlineStart: "50%",
      insetBlockStart: "78%",
      opacity: "1",
      transform: finalTransform,
      animationName,
      animationDuration: "1ms",
      animationTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
      animationFillMode: "both",
      animationTimeline: "--blog-fan",
      animationRange: `entry ${rangeStart}% cover ${rangeEnd}%`,
      [`@keyframes ${animationName}`]: {
        from: {
          opacity: "0",
          transform:
            "translate3d(-50%, -50%, 0) translate3d(0, 0, 0) rotate(0deg) scale(0.16)",
        },
        "22%": { opacity: "1" },
        to: { opacity: "1", transform: finalTransform },
      },
      "@media (max-width: 47.999rem)": {
        "--fan-x": `${position.mobile[0]}vw`,
        "--fan-y": `${position.mobile[1]}dvh`,
        insetBlockStart: "77%",
      },
      "@media (prefers-reduced-motion: reduce)": {
        animation: "none",
      },
    } as Parameters<typeof css>[0],
  );
}

const uniqueSkillSlug = createUniqueSlugger("skill");
const SKILLS: readonly Skill[] = SKILL_DEFINITIONS.map((skill, index) => ({
  ...skill,
  id: createDomId("skill", uniqueSkillSlug(skill.label)),
  motion: createFanMotion(index),
}));
