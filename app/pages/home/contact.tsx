import githubSvg from "simple-icons/icons/github.svg" with { type: "text" };
import rssSvg from "simple-icons/icons/rss.svg" with { type: "text" };
import telegramSvg from "simple-icons/icons/telegram.svg" with {
  type: "text",
};
import { css, type Handle } from "remix/ui";

import { createI18n, DEFAULT_LANG, type I18n } from "@/i18n/index.ts";
import {
  ScrollDrivenAnimation,
  type ScrollDrivenKeyframes,
} from "@/components/animation/scroll-driven.tsx";
import { BrandIcon } from "@/components/brand-icon.tsx";
import { HOME_ASSETS } from "@/constants/index.ts";

type ContactProject = {
  id: string;
  copyKey:
    | "rssbook"
    | "clawless"
    | "aiSdkX"
    | "niapyaProfile"
    | "lunaSticker"
    | "lunaChat";
  image: string;
  width: number;
  height: number;
  edge: "top" | "bottom";
  column: "left" | "center" | "right";
  widthClass: string;
  anchorTransform: string;
  mediaTransform: string;
  range: string;
  keyframes: ScrollDrivenKeyframes;
};

type ContactLink = {
  label: string;
  descriptionKey: "github" | "telegram" | "feed";
  href: string;
  icon: { svg: string; color: string };
  className: string;
};

const CONTACT_PROJECTS = [
  {
    id: "rssbook",
    copyKey: "rssbook",
    image: HOME_ASSETS.rssbook.src,
    width: HOME_ASSETS.rssbook.width,
    height: HOME_ASSETS.rssbook.height,
    edge: "top",
    column: "left",
    widthClass: "w-64 sm:w-80 md:w-72 lg:w-96",
    anchorTransform: "translate3d(-34vw, -36dvh, 0)",
    mediaTransform: "rotate(-7deg) scale(0.92)",
    range: "entry 8% cover 60%",
    keyframes: {
      from: {
        opacity: 0.2,
        transform:
          "translate3d(calc(-50% + 34vw), calc(-50% + 36dvh), 0) scale(0.22)",
      },
      to: {
        opacity: 1,
        transform: "translate3d(-50%, -50%, 0) scale(1)",
      },
    },
  },
  {
    id: "clawless",
    copyKey: "clawless",
    image: HOME_ASSETS.clawless.src,
    width: HOME_ASSETS.clawless.width,
    height: HOME_ASSETS.clawless.height,
    edge: "top",
    column: "center",
    widthClass: "w-72 sm:w-96 md:w-80 lg:w-96",
    anchorTransform: "translate3d(-7vw, -36dvh, 0)",
    mediaTransform: "rotate(3deg) scale(0.88)",
    range: "entry 12% cover 68%",
    keyframes: {
      from: {
        opacity: 0.25,
        transform:
          "translate3d(calc(-50% + 7vw), calc(-50% + 36dvh), 0) scale(0.2)",
      },
      to: {
        opacity: 1,
        transform: "translate3d(-50%, -50%, 0) scale(1)",
      },
    },
  },
  {
    id: "ai-sdk-x",
    copyKey: "aiSdkX",
    image: HOME_ASSETS.aiSdkX.src,
    width: HOME_ASSETS.aiSdkX.width,
    height: HOME_ASSETS.aiSdkX.height,
    edge: "top",
    column: "right",
    widthClass: "w-56 sm:w-72 md:w-64 lg:w-80",
    anchorTransform: "translate3d(33vw, -34dvh, 0)",
    mediaTransform: "rotate(8deg) scale(0.94)",
    range: "entry 6% cover 64%",
    keyframes: {
      from: {
        opacity: 0.2,
        transform:
          "translate3d(calc(-50% - 33vw), calc(-50% + 34dvh), 0) scale(0.24)",
      },
      to: {
        opacity: 1,
        transform: "translate3d(-50%, -50%, 0) scale(1)",
      },
    },
  },
  {
    id: "niapya-profile",
    copyKey: "niapyaProfile",
    image: HOME_ASSETS.profile.src,
    width: HOME_ASSETS.profile.width,
    height: HOME_ASSETS.profile.height,
    edge: "bottom",
    column: "left",
    widthClass: "w-64 sm:w-80 md:w-72 lg:w-96",
    anchorTransform: "translate3d(-34vw, 34dvh, 0)",
    mediaTransform: "rotate(7deg) scale(0.9)",
    range: "entry 14% cover 76%",
    keyframes: {
      from: {
        opacity: 0.2,
        transform:
          "translate3d(calc(-50% + 34vw), calc(-50% - 34dvh), 0) scale(0.2)",
      },
      to: {
        opacity: 1,
        transform: "translate3d(-50%, -50%, 0) scale(1)",
      },
    },
  },
  {
    id: "luna-sticker",
    copyKey: "lunaSticker",
    image: HOME_ASSETS.lunaSticker.src,
    width: HOME_ASSETS.lunaSticker.width,
    height: HOME_ASSETS.lunaSticker.height,
    edge: "bottom",
    column: "center",
    widthClass: "w-72 sm:w-96 md:w-80 lg:w-96",
    anchorTransform: "translate3d(-7vw, 36dvh, 0)",
    mediaTransform: "rotate(-3deg) scale(0.96)",
    range: "entry 10% cover 72%",
    keyframes: {
      from: {
        opacity: 0.25,
        transform:
          "translate3d(calc(-50% + 7vw), calc(-50% - 36dvh), 0) scale(0.22)",
      },
      to: {
        opacity: 1,
        transform: "translate3d(-50%, -50%, 0) scale(1)",
      },
    },
  },
  {
    id: "luna-chat",
    copyKey: "lunaChat",
    image: HOME_ASSETS.lunaChat.src,
    width: HOME_ASSETS.lunaChat.width,
    height: HOME_ASSETS.lunaChat.height,
    edge: "bottom",
    column: "right",
    widthClass: "w-56 sm:w-72 md:w-64 lg:w-80",
    anchorTransform: "translate3d(33vw, 34dvh, 0)",
    mediaTransform: "rotate(-6deg) scale(0.9)",
    range: "entry 16% cover 80%",
    keyframes: {
      from: {
        opacity: 0.2,
        transform:
          "translate3d(calc(-50% - 33vw), calc(-50% - 34dvh), 0) scale(0.2)",
      },
      to: {
        opacity: 1,
        transform: "translate3d(-50%, -50%, 0) scale(1)",
      },
    },
  },
] as const satisfies readonly ContactProject[];

const CONTACT_LINKS = [
  {
    label: "GitHub",
    descriptionKey: "github",
    href: "https://github.com/Niapya",
    icon: { svg: githubSvg, color: "#181717" },
    className: "bg-secondary text-secondary-foreground",
  },
  {
    label: "Telegram",
    descriptionKey: "telegram",
    href: "https://t.me/Niapya",
    icon: { svg: telegramSvg, color: "#26A5E4" },
    className: "bg-accent text-accent-foreground",
  },
  {
    label: "Feed",
    descriptionKey: "feed",
    href: "/rss.xml",
    icon: { svg: rssSvg, color: "#FFA500" },
    className: "bg-muted text-foreground",
  },
] as const satisfies readonly ContactLink[];

const PANEL_KEYFRAMES = {
  from: { opacity: 0.6, transform: "scale(0)" },
  to: { opacity: 1, transform: "scale(1)" },
} satisfies ScrollDrivenKeyframes;

type ContactProps = {
  i18n?: I18n;
};

const contactSectionStyle = css(
  {
    height: "100dvh",
    viewTimelineName: "--contact-timeline",
    viewTimelineAxis: "block",
    "& .contact-stage": {
      transform: "scale(1)",
      transformOrigin: "center",
      willChange: "transform, opacity",
    },
    "& .contact-project-motion": {
      willChange: "transform, opacity",
    },
    "@media (max-width: 47.999rem)": {
      "& [data-contact-project-anchor]": {
        transform: "none !important",
      },
      "& .contact-project-motion": {
        animation: "none !important",
        opacity: "1 !important",
        transform: "translate3d(-50%, -50%, 0) !important",
      },
    },
    "@media (prefers-reduced-motion: reduce)": {
      "& .contact-stage, & .contact-project-motion": {
        willChange: "auto",
      },
    },
  } as Parameters<typeof css>[0],
);

const contactCardStyle = css({
  "& [data-contact-links]": {
    gap: "0",
    transition: "gap 500ms cubic-bezier(0.16, 1, 0.3, 1)",
  },
  "& [data-contact-link]": {
    transitionProperty: "transform, margin-inline-start, box-shadow",
    transitionDuration: "500ms",
    transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
  },
  "& [data-contact-link]:not(:first-child)": {
    marginInlineStart: "-0.75rem",
  },
  "& [data-contact-link]:nth-child(1)": {
    transform: "translateY(0.25rem) rotate(-7deg) scale(0.94)",
  },
  "& [data-contact-link]:nth-child(2)": {
    transform: "translateY(-0.25rem) rotate(3deg)",
  },
  "& [data-contact-link]:nth-child(3)": {
    transform: "translateY(0.375rem) rotate(7deg) scale(0.93)",
  },
  "&:hover [data-contact-links], &:focus-within [data-contact-links]": {
    gap: "0.5rem",
  },
  "&:hover [data-contact-link], &:focus-within [data-contact-link]": {
    marginInlineStart: "0",
    transform: "none",
  },
  "@media (prefers-reduced-motion: reduce)": {
    "& [data-contact-links], & [data-contact-link]": {
      transition: "none",
    },
  },
});

export function Contact(handle: Handle<ContactProps>) {
  return () => {
    const copy =
      (handle.props.i18n ?? createI18n(DEFAULT_LANG)).messages.home.contact;
    const projectCopy: Readonly<Record<string, string>> = copy.projects;
    const fallbackProjectCopy: Readonly<Record<string, string>> = createI18n(
      DEFAULT_LANG,
    ).messages.home.contact.projects;

    return (
      <section
        id="contact"
        aria-labelledby="contact-title"
        class="relative isolate overflow-hidden bg-muted text-foreground"
        mix={contactSectionStyle}
      >
        <ScrollDrivenAnimation
          class="contact-stage absolute inset-5 overflow-hidden rounded-md border border-border bg-background shadow-lg sm:inset-10 lg:inset-16"
          timeline="--contact-timeline"
          range="entry 20% cover 45%"
          easing="cubic-bezier(0.16, 1, 0.3, 1)"
          keyframes={PANEL_KEYFRAMES}
        >
          <div class="relative h-full w-full overflow-hidden">
            <div class="pointer-events-none absolute inset-4 z-30 flex select-none items-center justify-center">
              <div
                data-contact-cluster
                class="relative w-80 max-w-full sm:w-96"
              >
                {CONTACT_PROJECTS.map((project) => (
                  <div
                    key={project.id}
                    data-contact-project-anchor={project.id}
                    aria-hidden="true"
                    class={`pointer-events-none absolute z-10 select-none ${
                      project.edge === "top" ? "top-0" : "bottom-0"
                    } ${
                      project.column === "left"
                        ? "left-0"
                        : project.column === "center"
                        ? "left-1/2"
                        : "left-full"
                    } md:top-1/2 md:bottom-auto md:left-1/2`}
                    style={{ transform: project.anchorTransform }}
                  >
                    <ScrollDrivenAnimation
                      class={`contact-project-motion -translate-x-1/2 -translate-y-1/2 transform-gpu ${project.widthClass}`}
                      timeline="--contact-timeline"
                      range={project.range}
                      easing="cubic-bezier(0.16, 1, 0.3, 1)"
                      keyframes={project.keyframes}
                    >
                      <figure
                        class="overflow-hidden rounded-sm border border-primary bg-card shadow-sm"
                        style={{
                          aspectRatio: `${project.width} / ${project.height}`,
                          transform: project.mediaTransform,
                        }}
                      >
                        <img
                          data-contact-project
                          src={project.image}
                          alt={projectCopy[project.copyKey] ??
                            fallbackProjectCopy[project.copyKey]}
                          width={project.width}
                          height={project.height}
                          loading="lazy"
                          decoding="async"
                          class="h-full w-full object-cover"
                        />
                      </figure>
                    </ScrollDrivenAnimation>
                  </div>
                ))}

                <article
                  class="group pointer-events-auto relative z-20 w-full rounded-sm border border-border bg-card p-5 text-center text-card-foreground shadow-sm sm:p-6"
                  mix={contactCardStyle}
                >
                  <h2
                    id="contact-title"
                    class="font-display text-4xl italic leading-none sm:text-5xl"
                  >
                    {copy.title}
                  </h2>

                  <div
                    data-contact-links
                    class="mt-6 flex items-center justify-center"
                  >
                    {CONTACT_LINKS.map((link) => (
                      <a
                        key={link.label}
                        data-contact-link
                        href={link.href}
                        target={link.href.startsWith("http")
                          ? "_blank"
                          : undefined}
                        rel={link.href.startsWith("http")
                          ? "noreferrer"
                          : undefined}
                        aria-label={`${link.label}: ${
                          copy.links[link.descriptionKey]
                        }`}
                        class={`flex h-18 w-18 flex-col shrink-0 cursor-pointer select-none items-center justify-center gap-2 rounded-sm border border-border shadow-sm focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring sm:h-22 sm:w-22 ${link.className}`}
                      >
                        <span class="flex h-10 w-10 items-center justify-center rounded-full bg-white">
                          <BrandIcon
                            svg={link.icon.svg}
                            color={link.icon.color}
                            className="block h-6 w-6"
                          />
                        </span>
                        <span class="font-medium font-sans text-xs">
                          {link.label}
                        </span>
                      </a>
                    ))}
                  </div>

                  <p class="mt-6 font-sans text-muted-foreground text-sm leading-6">
                    {copy.description}
                  </p>
                </article>
              </div>
            </div>
          </div>
        </ScrollDrivenAnimation>
      </section>
    );
  };
}
