import { MousePointer2 } from "lucide";
import { css, type Handle } from "remix/ui";

import { createI18n, DEFAULT_LANG, type I18n } from "@/i18n/index.ts";
import {
  ScrollDrivenAnimation,
  type ScrollDrivenKeyframes,
} from "@/components/animation/scroll-driven.tsx";
import { Icon } from "@/components/icon.tsx";
import { createDomId } from "@/utils/id.ts";
import { HOME_ASSETS } from "@/constants/home-assets.ts";

const DEVELOPER_PROJECTS = [
  {
    id: "rssbook",
    copyKey: "rssbook",
    number: "I",
    cursorTone: "rose",
    cursorToneClass: "text-rose-300 dark:text-rose-200",
    cursorBubbleClass: "bg-rose-200",
    href: "https://github.com/HackHTU/RSSBook",
    image: HOME_ASSETS.rssbook.src,
  },
  {
    id: "clawless",
    copyKey: "clawless",
    number: "II",
    cursorTone: "sky",
    cursorToneClass: "text-sky-300 dark:text-sky-200",
    cursorBubbleClass: "bg-sky-200",
    href: "https://github.com/Niapya/clawless",
    image: HOME_ASSETS.clawless.src,
  },
  {
    id: "ai-sdk-x",
    copyKey: "aiSdkX",
    number: "III",
    cursorTone: "amber",
    cursorToneClass: "text-amber-300 dark:text-amber-200",
    cursorBubbleClass: "bg-amber-200",
    href: "https://github.com/Niapya/ai-sdk-x",
    image: HOME_ASSETS.aiSdkX.src,
  },
] as const;

const TEXT_HIGHLIGHT_KEYFRAMES = {
  from: {
    color: "color-mix(in oklab, var(--foreground) 3%, var(--background))",
  },
  to: { color: "var(--foreground)" },
} satisfies ScrollDrivenKeyframes;

const CURSOR_ENTER_PATH_MOBILE =
  "shape(from 18% calc(100% + 2rem), curve to 50% 6.75rem with 24% 72% / 42% 30%, curve to 18% calc(100% + 2rem) with 42% 30% / 24% 72%)";
const CURSOR_EXIT_PATH_MOBILE =
  "shape(from 50% 6.75rem, curve to 82% calc(100% + 2rem) with 58% 30% / 76% 72%, curve to 50% 6.75rem with 76% 72% / 58% 30%)";
const CURSOR_ENTER_PATH_WIDE_MOBILE =
  "shape(from 18% calc(100% + 2rem), curve to 50% 8.125rem with 24% 72% / 42% 30%, curve to 18% calc(100% + 2rem) with 42% 30% / 24% 72%)";
const CURSOR_EXIT_PATH_WIDE_MOBILE =
  "shape(from 50% 8.125rem, curve to 82% calc(100% + 2rem) with 58% 30% / 76% 72%, curve to 50% 8.125rem with 76% 72% / 58% 30%)";
const CURSOR_ENTER_PATH_TABLET =
  "shape(from 18% calc(100% + 2.5rem), curve to 50% 8.125rem with 24% 72% / 42% 30%, curve to 18% calc(100% + 2.5rem) with 42% 30% / 24% 72%)";
const CURSOR_EXIT_PATH_TABLET =
  "shape(from 50% 8.125rem, curve to 82% calc(100% + 2.5rem) with 58% 30% / 76% 72%, curve to 50% 8.125rem with 76% 72% / 58% 30%)";
const CURSOR_ENTER_PATH_DESKTOP =
  "shape(from 18% calc(100% + 3rem), curve to 50% 8.125rem with 24% 72% / 42% 30%, curve to 18% calc(100% + 3rem) with 42% 30% / 24% 72%)";
const CURSOR_EXIT_PATH_DESKTOP =
  "shape(from 50% 8.125rem, curve to 82% calc(100% + 3rem) with 58% 30% / 76% 72%, curve to 50% 8.125rem with 76% 72% / 58% 30%)";
const CURSOR_ENTER_PATH_SHORT =
  "shape(from 18% calc(100% + 0.5rem), curve to 50% 4.375rem with 24% 72% / 42% 32%, curve to 18% calc(100% + 0.5rem) with 42% 32% / 24% 72%)";
const CURSOR_EXIT_PATH_SHORT =
  "shape(from 50% 4.375rem, curve to 82% calc(100% + 0.5rem) with 58% 32% / 76% 72%, curve to 50% 4.375rem with 76% 72% / 58% 32%)";

type DeveloperProps = {
  i18n?: I18n;
};
type MousePointerIconProps = {
  toneClass: string;
};
type InlineTokenProps = {
  emphasis: string;
  indicator: "code" | "layout" | "status";
  joiner: string;
  suffix: string;
};

const sectionStyle = css({
  height: "100dvh",
  "& .developer-copy-sentence": {
    color: "color-mix(in oklab, var(--foreground) 3%, var(--background))",
  },
});

const contentStyle = css({
  paddingBlock: "2rem",
  "@media (min-width: 48rem)": {
    paddingBlock: "2.5rem",
  },
  "@media (min-width: 64rem)": {
    paddingBlock: "3rem",
  },
  "@media (max-height: 50rem)": {
    paddingBlock: "2rem",
  },
  "@media (max-height: 46rem)": {
    paddingBlock: "0.5rem",
  },
});

const copyStyle = css({
  fontSize: "1.25rem",
  lineHeight: "2rem",
  marginTop: "2rem",
  paddingBlock: "0.5rem",
  "@media (min-width: 48rem)": {
    fontSize: "1.5rem",
    lineHeight: "2.25rem",
    marginTop: "2.5rem",
    paddingBlock: "1rem",
  },
  "@media (min-width: 64rem)": {
    fontSize: "1.75rem",
    lineHeight: "2.5rem",
  },
  "@media (max-height: 50rem)": {
    fontSize: "1.25rem",
    lineHeight: "2rem",
    marginTop: "1.5rem",
    paddingBlock: "0.5rem",
  },
  "@media (max-height: 46rem)": {
    fontSize: "0.875rem",
    lineHeight: "1.75rem",
    marginTop: "0.5rem",
    paddingBlock: "0",
  },
});

const inlineTokenStyle = css({
  fontSize: "1rem",
  height: "2rem",
  "@media (min-width: 48rem)": {
    fontSize: "1.125rem",
    height: "2.25rem",
  },
  "@media (min-width: 64rem)": {
    fontSize: "1.25rem",
    height: "2.5rem",
  },
  "@media (max-height: 50rem)": {
    fontSize: "1rem",
    height: "2rem",
  },
  "@media (max-height: 46rem)": {
    fontSize: "0.875rem",
    height: "1.75rem",
  },
});

const collectionsStyle = css({
  marginTop: "2rem",
  "@media (min-width: 48rem)": {
    marginTop: "2.5rem",
  },
  "@media (max-height: 50rem)": {
    marginTop: "1.5rem",
  },
  "@media (max-height: 46rem)": {
    marginTop: "0.5rem",
  },
});

const projectSwitcherStyle = css({
  "& [data-project-stack]": {
    gridTemplateAreas: '"stack"',
    height: "clamp(13rem, 28dvh, 17rem)",
  },
  "& [data-project-card]": {
    aspectRatio: "4 / 5",
    alignSelf: "start",
    gridArea: "stack",
    height: "auto",
    justifySelf: "center",
    maxHeight: "16rem",
    maxWidth: "13rem",
    width: "44vw",
    transformOrigin: "center 90%",
    transitionProperty: "transform, opacity, filter",
    transitionDuration: "700ms",
    transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
  },
  "& [data-project-card='0']": {
    zIndex: 10,
    transform: "translateX(-30%) rotate(-5deg) scale(0.92)",
  },
  "& [data-project-card='1']": {
    zIndex: 30,
    transform: "translateX(0) rotate(0) scale(1)",
  },
  "& [data-project-card='2']": {
    zIndex: 20,
    transform: "translateX(30%) rotate(5deg) scale(0.92)",
  },
  "&:has(fieldset > input:nth-of-type(1):checked) [data-project-card='0']": {
    zIndex: 30,
    transform: "translateX(0) rotate(0) scale(1)",
  },
  "&:has(fieldset > input:nth-of-type(1):checked) [data-project-card='1']": {
    zIndex: 20,
    transform: "translateX(30%) rotate(5deg) scale(0.92)",
  },
  "&:has(fieldset > input:nth-of-type(1):checked) [data-project-card='2']": {
    zIndex: 10,
    transform: "translateX(-30%) rotate(-5deg) scale(0.92)",
  },
  "&:has(fieldset > input:nth-of-type(3):checked) [data-project-card='1']": {
    zIndex: 20,
    transform: "translateX(30%) rotate(5deg) scale(0.92)",
  },
  "&:has(fieldset > input:nth-of-type(3):checked) [data-project-card='2']": {
    zIndex: 30,
    transform: "translateX(0) rotate(0) scale(1)",
  },
  "& fieldset::before": {
    backgroundColor: "var(--foreground)",
    borderRadius: "9999px",
    content: '""',
    height: "2.5rem",
    inset: "0.25rem auto auto 0.25rem",
    position: "absolute",
    transform: "translateX(0)",
    transition: "transform 500ms cubic-bezier(0.16, 1, 0.3, 1)",
    width: "4rem",
    zIndex: 0,
  },
  "& fieldset:has(input:nth-of-type(2):checked)::before": {
    transform: "translateX(4.25rem)",
  },
  "& fieldset:has(input:nth-of-type(3):checked)::before": {
    transform: "translateX(8.5rem)",
  },
  "& fieldset > input:checked + label": {
    color: "var(--background)",
    fontWeight: 600,
  },
  "& fieldset > input:focus-visible + label": {
    outline: "0.125rem solid var(--ring)",
    outlineOffset: "0.25rem",
  },
  "& [data-project-cursor], & [data-entry-cursor]": {
    display: "block",
    position: "absolute",
    inset: "0 auto auto 0",
    zIndex: 70,
    offsetAnchor: "0.34rem 0.39rem",
    offsetPosition: "0 0",
    offsetRotate: "0deg",
    willChange: "offset-distance, opacity",
  },
  "& [data-entry-cursor]": {
    opacity: 0,
    offsetPath: CURSOR_ENTER_PATH_MOBILE,
    offsetDistance: "0%",
  },
  "& [data-entry-visual]": {
    display: "none",
  },
  "& [data-cursor-phase='exit']": {
    opacity: 0,
    offsetPath: CURSOR_EXIT_PATH_MOBILE,
    offsetDistance: "50%",
    visibility: "visible",
    transitionProperty: "offset-distance, opacity",
    transitionDuration: "700ms, 180ms",
    transitionTimingFunction: "cubic-bezier(0.55, 0, 1, 0.45), linear",
    transitionDelay: "0ms, 520ms",
  },
  "& [data-cursor-content]": {
    animation: "developer-cursor-idle 1800ms ease-in-out 2200ms infinite",
  },
  "& [data-cursor-bubble]": {
    opacity: 0,
    transform: "scale(0.86) translateY(-0.25rem)",
    transformOrigin: "top left",
    transition:
      "opacity 240ms linear, transform 240ms cubic-bezier(0.16, 1, 0.3, 1)",
  },
  "&:has(fieldset > input:nth-of-type(1):checked) [data-entry-cursor]": {
    animation:
      "developer-cursor-enter-rose 1500ms cubic-bezier(0.16, 1, 0.3, 1) 700ms both",
    opacity: 1,
    offsetDistance: "50%",
  },
  "&:has(fieldset > input:nth-of-type(2):checked) [data-entry-cursor]": {
    animation:
      "developer-cursor-enter-sky 1500ms cubic-bezier(0.16, 1, 0.3, 1) 700ms both",
    opacity: 1,
    offsetDistance: "50%",
  },
  "&:has(fieldset > input:nth-of-type(3):checked) [data-entry-cursor]": {
    animation:
      "developer-cursor-enter-amber 1500ms cubic-bezier(0.16, 1, 0.3, 1) 700ms both",
    opacity: 1,
    offsetDistance: "50%",
  },
  "&:has(fieldset > input:nth-of-type(1):checked) [data-entry-visual='0'], &:has(fieldset > input:nth-of-type(2):checked) [data-entry-visual='1'], &:has(fieldset > input:nth-of-type(3):checked) [data-entry-visual='2']":
    {
      display: "flex",
    },
  "&:has(fieldset > input:nth-of-type(1):checked) [data-project-cursor='0'][data-cursor-phase='exit'], &:has(fieldset > input:nth-of-type(2):checked) [data-project-cursor='1'][data-cursor-phase='exit'], &:has(fieldset > input:nth-of-type(3):checked) [data-project-cursor='2'][data-cursor-phase='exit']":
    {
      opacity: 1,
      offsetDistance: "0%",
      visibility: "hidden",
    },
  "&:has(fieldset > input:nth-of-type(1):checked) [data-entry-visual='0'] [data-cursor-bubble], &:has(fieldset > input:nth-of-type(2):checked) [data-entry-visual='1'] [data-cursor-bubble], &:has(fieldset > input:nth-of-type(3):checked) [data-entry-visual='2'] [data-cursor-bubble]":
    {
      animation:
        "developer-cursor-bubble 240ms cubic-bezier(0.16, 1, 0.3, 1) 1850ms both",
      opacity: 1,
      transform: "scale(1) translateY(0)",
    },
  "&:has(fieldset > input:nth-of-type(1):checked) [data-project-cursor='0'][data-cursor-phase='exit'] [data-cursor-bubble], &:has(fieldset > input:nth-of-type(2):checked) [data-project-cursor='1'][data-cursor-phase='exit'] [data-cursor-bubble], &:has(fieldset > input:nth-of-type(3):checked) [data-project-cursor='2'][data-cursor-phase='exit'] [data-cursor-bubble]":
    {
      opacity: 1,
      transform: "scale(1) translateY(0)",
    },
  "@keyframes developer-cursor-enter-rose": {
    from: { offsetDistance: "0%", opacity: 0 },
    "12%": { opacity: 1 },
    to: { offsetDistance: "50%", opacity: 1 },
  },
  "@keyframes developer-cursor-enter-sky": {
    from: { offsetDistance: "0%", opacity: 0 },
    "12%": { opacity: 1 },
    to: { offsetDistance: "50%", opacity: 1 },
  },
  "@keyframes developer-cursor-enter-amber": {
    from: { offsetDistance: "0%", opacity: 0 },
    "12%": { opacity: 1 },
    to: { offsetDistance: "50%", opacity: 1 },
  },
  "@keyframes developer-cursor-bubble": {
    from: { opacity: 0, transform: "scale(0.86) translateY(-0.25rem)" },
    to: { opacity: 1, transform: "scale(1) translateY(0)" },
  },
  "@keyframes developer-cursor-idle": {
    "0%, 100%": { transform: "translateY(0)" },
    "50%": { transform: "translateY(-0.5rem)" },
  },
  "@media (min-width: 30rem)": {
    "& [data-entry-cursor]": {
      offsetPath: CURSOR_ENTER_PATH_WIDE_MOBILE,
    },
    "& [data-cursor-phase='exit']": {
      offsetPath: CURSOR_EXIT_PATH_WIDE_MOBILE,
    },
  },
  "@media (min-width: 48rem)": {
    "& [data-project-card='0']": {
      transform: "translateX(-42%) rotate(-6deg) scale(0.92)",
    },
    "& [data-project-card='2']": {
      transform: "translateX(42%) rotate(6deg) scale(0.92)",
    },
    "&:has(fieldset > input:nth-of-type(1):checked) [data-project-card='1']": {
      transform: "translateX(42%) rotate(6deg) scale(0.92)",
    },
    "&:has(fieldset > input:nth-of-type(1):checked) [data-project-card='2']": {
      transform: "translateX(-42%) rotate(-6deg) scale(0.92)",
    },
    "&:has(fieldset > input:nth-of-type(3):checked) [data-project-card='1']": {
      transform: "translateX(42%) rotate(6deg) scale(0.92)",
    },
    "& [data-entry-cursor]": {
      offsetPath: CURSOR_ENTER_PATH_TABLET,
    },
    "& [data-cursor-phase='exit']": {
      offsetPath: CURSOR_EXIT_PATH_TABLET,
    },
  },
  "@media (min-width: 64rem)": {
    "& [data-project-card='0']": {
      transform: "translateX(-50%) rotate(-6deg) scale(0.92)",
    },
    "& [data-project-card='2']": {
      transform: "translateX(50%) rotate(6deg) scale(0.92)",
    },
    "&:has(fieldset > input:nth-of-type(1):checked) [data-project-card='1']": {
      transform: "translateX(50%) rotate(6deg) scale(0.92)",
    },
    "&:has(fieldset > input:nth-of-type(1):checked) [data-project-card='2']": {
      transform: "translateX(-50%) rotate(-6deg) scale(0.92)",
    },
    "&:has(fieldset > input:nth-of-type(3):checked) [data-project-card='1']": {
      transform: "translateX(50%) rotate(6deg) scale(0.92)",
    },
    "& [data-entry-cursor]": {
      offsetPath: CURSOR_ENTER_PATH_DESKTOP,
    },
    "& [data-cursor-phase='exit']": {
      offsetPath: CURSOR_EXIT_PATH_DESKTOP,
    },
  },
  "@media (max-height: 50rem)": {
    "& [data-project-stack]": {
      height: "16rem",
    },
    "& fieldset": {
      marginTop: "1.5rem",
    },
  },
  "@media (max-height: 46rem)": {
    "& [data-project-stack]": {
      height: "clamp(9rem, 22dvh, 11rem)",
    },
    "& [data-project-card]": {
      maxWidth: "7rem",
      width: "36vw",
    },
    "& [data-entry-cursor]": {
      offsetPath: CURSOR_ENTER_PATH_SHORT,
    },
    "& [data-cursor-phase='exit']": {
      offsetPath: CURSOR_EXIT_PATH_SHORT,
    },
  },
  "@media (prefers-reduced-motion: reduce)": {
    "& [data-project-card]": {
      transition: "none",
    },
    "& fieldset::before, & fieldset > label, & [data-project-cursor], & [data-entry-cursor], & [data-cursor-bubble]":
      {
        transition: "none",
      },
    "& [data-project-cursor], & [data-entry-cursor]": {
      animation: "none",
    },
    "& [data-cursor-content]": { animation: "none" },
  },
});

function MousePointerIcon(handle: Handle<MousePointerIconProps>) {
  return () => {
    const { toneClass } = handle.props;

    return (
      <Icon
        icon={MousePointer2}
        className={`h-8 w-8 overflow-visible drop-shadow-sm ${toneClass}`}
        fill="currentColor"
        stroke="white"
        strokeWidth={1.5}
      />
    );
  };
}

function InlineToken(handle: Handle<InlineTokenProps>) {
  return () => {
    const { emphasis, indicator, joiner, suffix } = handle.props;

    return (
      <span
        data-inline-token={indicator}
        class="mx-2 inline-flex items-center gap-2 rounded-full border border-border bg-card px-2 align-middle text-card-foreground leading-none shadow-md md:px-3"
        mix={inlineTokenStyle}
      >
        {indicator === "code" && (
          <span
            aria-hidden="true"
            class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-foreground font-semibold text-background text-xs"
          >
            {"{ }"}
          </span>
        )}
        {indicator === "layout" && (
          <span
            aria-hidden="true"
            class="flex h-6 w-6 items-end justify-center gap-1 rounded-full bg-muted px-1 py-1"
          >
            <span class="h-2 w-1 bg-foreground" />
            <span class="h-4 w-1 bg-foreground" />
            <span class="h-3 w-1 bg-foreground" />
          </span>
        )}
        {indicator === "status" && (
          <span
            aria-hidden="true"
            class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted"
          >
            <span class="h-2 w-2 rounded-full bg-emerald-400 shadow-sm" />
          </span>
        )}
        <em class="font-serif italic">{emphasis}</em>
        <span class="font-mono">{joiner}{suffix}</span>
      </span>
    );
  };
}

export function Developer(handle: Handle<DeveloperProps>) {
  return () => {
    const copy =
      (handle.props.i18n ?? createI18n(DEFAULT_LANG)).messages.home.developer;

    return (
      <section
        id="developer"
        aria-labelledby="developer-title"
        class="overflow-clip border-border border-t bg-background text-foreground"
        mix={sectionStyle}
      >
        <div
          class="mx-auto flex h-full w-full max-w-8xl flex-col justify-center px-5 sm:px-10 lg:justify-start lg:px-16"
          mix={contentStyle}
        >
          <header class="text-center lg:text-left">
            <h2
              id="developer-title"
              class="font-display text-4xl leading-none sm:text-5xl lg:text-6xl"
            >
              <span class="block">{copy.title.lineOne}</span>
              <span class="block">{copy.title.lineTwo}</span>
            </h2>
          </header>

          <div
            role="paragraph"
            class="mx-auto max-w-3xl text-center font-medium font-sans"
            mix={copyStyle}
          >
            <ScrollDrivenAnimation
              class="developer-copy-sentence block"
              range="entry 20% cover 20%"
              easing="linear"
              keyframes={TEXT_HIGHLIGHT_KEYFRAMES}
            >
              {copy.sentenceOneBefore}
              <InlineToken
                emphasis={copy.tokenTypedApis.emphasis}
                indicator="code"
                joiner={copy.tokenTypedApis.joiner}
                suffix={copy.tokenTypedApis.suffix}
              />
              {copy.sentenceOneMiddle}
              <InlineToken
                emphasis={copy.tokenResponsiveUi.emphasis}
                indicator="layout"
                joiner={copy.tokenResponsiveUi.joiner}
                suffix={copy.tokenResponsiveUi.suffix}
              />
              {copy.sentenceOneAfter}
            </ScrollDrivenAnimation>{" "}
            <ScrollDrivenAnimation
              class="developer-copy-sentence block"
              range="entry 24% cover 44%"
              easing="linear"
              keyframes={TEXT_HIGHLIGHT_KEYFRAMES}
            >
              {copy.sentenceTwo}
            </ScrollDrivenAnimation>{" "}
            <ScrollDrivenAnimation
              class="developer-copy-sentence block"
              range="entry 48% cover 68%"
              easing="linear"
              keyframes={TEXT_HIGHLIGHT_KEYFRAMES}
            >
              {copy.sentenceThreeBefore}
              <InlineToken
                emphasis={copy.tokenProductionReady.emphasis}
                indicator="status"
                joiner={copy.tokenProductionReady.joiner}
                suffix={copy.tokenProductionReady.suffix}
              />
              {copy.sentenceThreeAfter}
            </ScrollDrivenAnimation>
          </div>

          <div
            data-collections
            class="relative lg:min-h-0 lg:flex-1"
            mix={[collectionsStyle, projectSwitcherStyle]}
          >
            <div class="relative mx-auto max-w-6xl">
              <div data-project-stack class="relative grid">
                {DEVELOPER_PROJECTS.map((project, index) => {
                  const projectCopy = copy.projects[project.copyKey];

                  return (
                    <a
                      key={project.id}
                      href={project.href}
                      target="_blank"
                      rel="noreferrer"
                      data-project-card={String(index)}
                      aria-label={projectCopy.title}
                      class="relative focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                    >
                      <div class="h-full overflow-hidden rounded-sm border border-border bg-muted shadow-lg">
                        <img
                          src={project.image}
                          alt={projectCopy.imageAlt}
                          class="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </a>
                  );
                })}
              </div>

              <fieldset class="relative isolate z-50 mx-auto mt-8 flex w-fit items-center gap-1 rounded-full border border-border bg-muted/40 p-1">
                <legend class="sr-only">{copy.collectionLegend}</legend>
                {DEVELOPER_PROJECTS.map((project, index) => (
                  <>
                    <input
                      key={`${project.id}-input`}
                      id={createDomId(
                        "developer-project",
                        project.id,
                        "control",
                      )}
                      class="sr-only"
                      type="radio"
                      name="developer-collection"
                      value={project.id}
                      checked={index === 1}
                    />
                    <label
                      key={`${project.id}-label`}
                      for={createDomId(
                        "developer-project",
                        project.id,
                        "control",
                      )}
                      class="relative z-10 flex h-10 w-16 cursor-pointer items-center justify-center rounded-full border border-transparent bg-transparent font-medium font-sans text-muted-foreground text-xs transition-colors duration-300"
                    >
                      {project.number}
                    </label>
                  </>
                ))}
              </fieldset>
            </div>

            <div
              data-entry-cursor
              aria-hidden="true"
              class="pointer-events-none"
            >
              {DEVELOPER_PROJECTS.map((project, index) => {
                const projectCopy = copy.projects[project.copyKey];

                return (
                  <div
                    key={`${project.id}-entry-visual`}
                    data-entry-visual={String(index)}
                    data-cursor-tone={project.cursorTone}
                    data-cursor-content
                    class="items-start"
                  >
                    <MousePointerIcon toneClass={project.cursorToneClass} />
                    <span
                      data-cursor-bubble
                      class={`mt-5 -ml-1 inline-flex items-center whitespace-nowrap rounded-full px-4 py-2 font-sans font-semibold text-black text-sm shadow-sm ${project.cursorBubbleClass}`}
                    >
                      {projectCopy.title}
                    </span>
                  </div>
                );
              })}
            </div>

            {DEVELOPER_PROJECTS.map((project, index) => {
              const projectCopy = copy.projects[project.copyKey];

              return (
                <div
                  key={`${project.id}-exit-cursor`}
                  data-project-cursor={String(index)}
                  data-cursor-phase="exit"
                  data-cursor-tone={project.cursorTone}
                  aria-hidden="true"
                  class="pointer-events-none"
                >
                  <div data-cursor-content class="flex items-start">
                    <MousePointerIcon toneClass={project.cursorToneClass} />
                    <span
                      data-cursor-bubble
                      class={`mt-5 -ml-1 inline-flex items-center whitespace-nowrap rounded-full px-4 py-2 font-sans font-semibold text-black text-sm shadow-sm ${project.cursorBubbleClass}`}
                    >
                      {projectCopy.title}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  };
}
