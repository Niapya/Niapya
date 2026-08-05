import { css, cx } from "@twind/core";
import type { Handle } from "remix/ui";

import { GITHUB_AVATAR_URL, HOME_ASSETS } from "@/constants/index.ts";
import { createI18n, DEFAULT_LANG, type I18n } from "@/i18n/index.ts";
import { Icon } from "@/components/icon.tsx";
import { createDomId } from "@/utils/id.ts";

type DesignerProps = {
  i18n?: I18n;
};

const DESIGN_PROJECTS = [
  {
    titleKey: "niapya",
    image: HOME_ASSETS.profile,
    href: "https://github.com/Niapya",
  },
  {
    titleKey: "lunaSticker",
    image: HOME_ASSETS.lunaSticker,
    href: "https://luna.htu.me/en",
  },
  {
    titleKey: "lunaChat",
    image: HOME_ASSETS.lunaChat,
    href: "https://luna.htu.me/en",
  },
] as const;

const introGridStyle = css({
  gridTemplateColumns: "minmax(0, 1fr) minmax(6rem, 1fr) minmax(0, 1.2fr)",
  "& > *": {
    paddingInline: "0.25rem",
  },
  "@media (min-width: 64rem)": {
    gridTemplateColumns: "minmax(0, 1fr) minmax(16rem, 0.8fr) minmax(0, 1fr)",
    "& > *": {
      paddingInline: "1rem",
    },
  },
});

const ringSizeStyle = css({
  width: "min(30vw, 10rem)",
});

const ringGraphicStyle = css({
  inset: "-5%",
  height: "110%",
  width: "110%",
});

const ringContainerStyle = css({
  "@keyframes work-ring-spin": {
    from: { transform: "rotate(0deg)" },
    to: { transform: "rotate(360deg)" },
  },
  "& > svg": {
    animation: "work-ring-spin 24s linear infinite",
  },
  "&:hover > svg, &:focus-within > svg": {
    animationPlayState: "paused",
  },
  "@media (prefers-reduced-motion: reduce)": {
    "& > svg": {
      animation: "none",
    },
  },
});

const ringTextStyle = css({
  fontSize: "0.5rem",
  letterSpacing: "0.2em",
});

const titleStyle = css({
  fontFamily: "var(--font-sans)",
  lineHeight: "1",
});

const graphicTitleStyle = css({
  fontSize: "clamp(1.4rem, 3vw, 3rem)",
});

const designerTitleStyle = css({
  fontSize: "clamp(1.8rem, 5vw, 5rem)",
});

const bottomGridStyle = css({
  gridTemplateColumns: "minmax(0, 1fr) minmax(6rem, 30%)",
  "& > *": {
    paddingInline: "0.25rem",
  },
  "@media (min-width: 64rem)": {
    gridTemplateColumns: "minmax(0, 1fr) 18rem",
    "& > *": {
      paddingInline: "1.25rem",
    },
  },
});

const cardOverlayStyle = css({
  minWidth: "17rem",
});

const cardTitleStyle = css({
  textShadow: "0 0.1em 0.5em rgb(0 0 0 / 45%)",
});

const designerItemsStyle = css({
  minHeight: "20rem",
  "& > a": {
    minHeight: "5rem",
    flexGrow: "0",
    flexShrink: "1",
    flexBasis: "20%",
    transitionProperty: "flex-grow, flex-basis",
    transitionDuration: "600ms",
    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
  },
  "& > a:first-child": {
    flexGrow: "1",
    flexBasis: "0%",
  },
  "& > a [data-card-content]": {
    opacity: "0",
    transition: "opacity 300ms ease",
  },
  "& > a:first-child [data-card-content]": {
    opacity: "1",
  },
  "@media (min-width: 48rem)": {
    minHeight: "24rem",
    "& > a": {
      minHeight: "0",
      flexBasis: "16%",
    },
  },
  "@media (hover: hover)": {
    "&:has(> a:hover) > a:first-child:not(:hover)": {
      flexGrow: "0",
      flexBasis: "10%",
    },
    "&:has(> a:hover) > a:not(:hover) [data-card-content]": {
      opacity: "0",
    },
    "& > a:hover": {
      flexGrow: "1",
      flexBasis: "0%",
    },
    "& > a:hover [data-card-content]": {
      opacity: "1",
    },
  },
  "&:has(> a:focus-visible) > a:first-child:not(:focus-visible)": {
    flexGrow: "0",
    flexBasis: "10%",
  },
  "&:has(> a:focus-visible) > a:not(:focus-visible) [data-card-content]": {
    opacity: "0",
  },
  "& > a:focus-visible": {
    flexGrow: "1",
    flexBasis: "0%",
  },
  "& > a:focus-visible [data-card-content]": {
    opacity: "1",
  },
});

export function Designer(handle: Handle<DesignerProps>) {
  const ringTopId = createDomId(handle.id, "work-ring", "top");
  const ringBottomId = createDomId(handle.id, "work-ring", "bottom");

  return () => {
    const copy =
      (handle.props.i18n ?? createI18n(DEFAULT_LANG)).messages.home.designer;

    return (
      <section
        id="work"
        aria-labelledby="work-title"
        class="min-h-dvh overflow-hidden bg-background text-foreground transition-colors"
      >
        <div class="mx-auto flex min-h-dvh w-full max-w-8xl flex-col justify-between px-5 py-8 sm:px-10 sm:py-12 lg:px-16 lg:py-14">
          <div class={cx("grid flex-1 items-center", introGridStyle)}>
            <header class="max-w-lg">
              <h2
                id="work-title"
                class={cx("font-semibold font-serif italic", titleStyle)}
              >
                <span class={cx("block", graphicTitleStyle)}>
                  {copy.titleGraphic}
                </span>
                <span
                  class={cx("block text-muted-foreground", designerTitleStyle)}
                >
                  {copy.titleDesigner}
                </span>
              </h2>
            </header>

            <div class="flex items-center justify-center">
              <div
                class={cx(
                  "group relative flex aspect-square select-none items-center justify-center",
                  ringSizeStyle,
                  ringContainerStyle,
                )}
              >
                <svg
                  aria-label={copy.available}
                  class={cx(
                    "pointer-events-none absolute origin-center text-muted-foreground will-change-transform",
                    ringGraphicStyle,
                  )}
                  fill="none"
                  role="img"
                  viewBox="0 0 200 200"
                >
                  <defs>
                    <path
                      id={ringTopId}
                      d="M 23,100 A 77,77 0 0,1 177,100"
                    />
                    <path
                      id={ringBottomId}
                      d="M 23,100 A 77,77 0 0,0 177,100"
                    />
                  </defs>
                  <text
                    class={cx(
                      "fill-current font-mono uppercase",
                      ringTextStyle,
                    )}
                  >
                    <textPath
                      href={`#${ringTopId}`}
                      startOffset="50%"
                      text-anchor="middle"
                    >
                      {copy.available}
                    </textPath>
                  </text>
                  <text
                    class={cx(
                      "fill-current font-mono uppercase",
                      ringTextStyle,
                    )}
                  >
                    <textPath
                      href={`#${ringBottomId}`}
                      startOffset="50%"
                      text-anchor="middle"
                    >
                      {copy.collaboration}
                    </textPath>
                  </text>
                </svg>
                <div class="relative aspect-square w-3/5 overflow-hidden rounded-full border border-foreground/10 bg-muted shadow-sm">
                  <img
                    src={GITHUB_AVATAR_URL}
                    alt={copy.imageAlt}
                    width="460"
                    height="460"
                    loading="lazy"
                    decoding="async"
                    class="h-full w-full object-cover object-center transition duration-700 group-hover:scale-105"
                  />
                </div>
              </div>
            </div>

            <div
              id="about"
              class="flex min-w-0 flex-col justify-between lg:min-h-full"
            >
              <div class="max-w-md self-end sm:mt-8 lg:mt-24">
                <p class="font-medium font-sans text-xs leading-4 sm:text-sm lg:text-lg lg:leading-5">
                  {copy.description}
                </p>
              </div>
              <a
                href="https://github.com/Niapya"
                target="_blank"
                rel="noreferrer"
                aria-label={copy.workListLabel}
                class="mt-10 inline-flex h-10 w-12 cursor-pointer select-none items-center justify-center self-end rounded-full border border-foreground/35 text-xl leading-none transition-all duration-300 hover:-rotate-6 hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring sm:mt-2 lg:mb-2"
              >
                <Icon name="lucide:arrow-right" className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div
            id="work-list"
            class={cx("mt-10 grid items-stretch", bottomGridStyle)}
          >
            <div
              class={cx(
                "flex min-w-0 flex-row items-stretch",
                designerItemsStyle,
              )}
            >
              {DESIGN_PROJECTS.map((project, index) => {
                const title = copy.tasks[project.titleKey];

                return (
                  <a
                    key={project.titleKey}
                    href={project.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={title}
                    class="group relative min-w-0 cursor-pointer select-none p-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                  >
                    <div class="relative h-full overflow-hidden rounded-xl border border-border bg-muted">
                      <img
                        src={project.image.src}
                        width={project.image.width}
                        height={project.image.height}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        decoding="async"
                        class="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                      <span
                        aria-hidden="true"
                        class={cx(
                          "absolute right-4 bottom-5 z-10 font-mono text-white/80 text-xs leading-none sm:right-5 sm:bottom-6",
                          cardTitleStyle,
                        )}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div
                        class={cx(
                          "absolute inset-0 flex flex-col justify-between p-5 sm:p-6",
                          cardOverlayStyle,
                        )}
                        data-card-content
                      >
                        <div class="absolute top-5 left-5 max-w-52 text-left sm:top-6 sm:left-6">
                          <h3
                            class={cx(
                              "font-sans font-semibold text-white text-xl leading-none sm:text-2xl",
                              cardTitleStyle,
                            )}
                          >
                            {title}
                          </h3>
                        </div>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>

            <div class="flex min-w-0 flex-col items-start justify-between pb-2">
              <p class="max-w-48 self-end text-right font-medium font-sans text-sm leading-none sm:text-xl lg:text-3xl">
                <span class="block">{copy.latestPrefix}</span>
                <span class="block text-muted-foreground">
                  {copy.latestSuffix}
                </span>
              </p>
              <a
                href="https://github.com/Niapya?tab=repositories"
                target="_blank"
                rel="noreferrer"
                aria-label={copy.backLabel}
                class="mt-auto inline-flex h-10 w-12 shrink-0 cursor-pointer select-none items-center justify-center self-end rounded-full border border-foreground/35 text-xl leading-none transition-all duration-300 hover:rotate-6 hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              >
                <Icon name="lucide:arrow-right" className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  };
}
