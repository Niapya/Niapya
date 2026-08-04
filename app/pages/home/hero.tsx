import { css, type Handle } from "remix/ui";

import { GITHUB_AVATAR_URL } from "@/constants/index.ts";
import { createI18n, DEFAULT_LANG, type I18n } from "@/i18n/index.ts";
import { RealisticCloud } from "@/components/background/realistic-cloud.tsx";
import { Noise } from "@/components/effect/noise.tsx";
import { Icon } from "@/components/icon.tsx";

type HeroProps = {
  i18n?: I18n;
};

const heroViewport = css({
  minHeight: "100dvh",
});

const heroSky = css({
  backgroundImage:
    "radial-gradient(circle at 88% 0%, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.16) 22%, transparent 48%), linear-gradient(to bottom left, oklch(0.55 0.2 240) 0%, oklch(0.66 0.18 230) 22%, oklch(0.8 0.11 220) 46%, oklch(0.91 0.04 235) 72%, oklch(0.97 0.015 245) 100%)",
  ".dark &": {
    backgroundImage:
      "radial-gradient(circle at 88% 0%, rgba(255, 255, 255, 0.24) 0%, rgba(255, 255, 255, 0.06) 24%, transparent 48%), linear-gradient(to bottom left, oklch(0.34 0.15 238) 0%, oklch(0.28 0.12 232) 30%, oklch(0.2 0.07 240) 62%, oklch(0.15 0.03 250) 100%)",
  },
  "@media (prefers-color-scheme: dark)": {
    ":root:not(.light) &": {
      backgroundImage:
        "radial-gradient(circle at 88% 0%, rgba(255, 255, 255, 0.24) 0%, rgba(255, 255, 255, 0.06) 24%, transparent 48%), linear-gradient(to bottom left, oklch(0.34 0.15 238) 0%, oklch(0.28 0.12 232) 30%, oklch(0.2 0.07 240) 62%, oklch(0.15 0.03 250) 100%)",
    },
  },
});

const heroGrid = css({
  backgroundImage:
    "linear-gradient(to right, rgba(255, 255, 255, 0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.42) 1px, transparent 1px)",
  backgroundSize: "3rem 3rem",
  maskImage: "linear-gradient(to bottom, black 0%, black 46%, transparent 94%)",
  ".dark &": {
    backgroundImage:
      "linear-gradient(to right, rgba(255, 255, 255, 0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.12) 1px, transparent 1px)",
  },
  "@media (prefers-color-scheme: dark)": {
    ":root:not(.light) &": {
      backgroundImage:
        "linear-gradient(to right, rgba(255, 255, 255, 0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.12) 1px, transparent 1px)",
    },
  },
});

const heroLightRays = css({
  width: "320vmax",
  height: "320vmax",
  transform: "translate3d(50%, -50%, 0) rotate(-8deg)",
  transformOrigin: "center",
  backgroundImage:
    "radial-gradient(circle at center, rgba(255, 255, 255, 0.76) 0%, rgba(255, 255, 255, 0.18) 12%, transparent 32%), repeating-conic-gradient(from 202deg at 50% 50%, transparent 0deg 7deg, rgba(255, 255, 255, 0.08) 9deg, rgba(255, 255, 255, 0.56) 12deg, rgba(255, 255, 255, 0.14) 17deg, transparent 20deg 28deg)",
  filter: "blur(0.3rem)",
  mixBlendMode: "screen",
  opacity: 0.84,
  willChange: "transform, opacity",
  animation: "hero-light-sweep 32s ease-in-out infinite alternate",
  "@keyframes hero-light-sweep": {
    from: {
      transform: "translate3d(50%, -50%, 0) rotate(-8deg) scale(1)",
      opacity: 0.68,
    },
    "48%": {
      opacity: 1,
    },
    to: {
      transform: "translate3d(50%, -50%, 0) rotate(4deg) scale(1.025)",
      opacity: 0.78,
    },
  },
  "@media (prefers-reduced-motion: reduce)": {
    animation: "none",
    opacity: 0.84,
  },
});

const heroWash = css({
  backgroundImage:
    "linear-gradient(to bottom left, transparent 0%, transparent 24%, color-mix(in oklab, var(--background) 55%, transparent) 44%, var(--background) 66%, var(--background) 100%)",
});

const heroCardEntrance = css({
  transform:
    "perspective(75rem) translate3d(0, 0, 0) rotateX(0deg) scale3d(1, 1, 1)",
  "@starting-style": {
    transform:
      "perspective(75rem) translate3d(0, calc(-100dvh - 100%), -12rem) rotateX(-12deg) scale3d(0.82, 0.82, 1)",
    opacity: 0,
  },
});

export function Hero(handle: Handle<HeroProps>) {
  return () => {
    const copy =
      (handle.props.i18n ?? createI18n(DEFAULT_LANG)).messages.home.hero;

    return (
      <section
        aria-labelledby="hero-title"
        class="relative isolate overflow-hidden bg-background text-foreground"
        mix={heroViewport}
      >
        <div
          aria-hidden="true"
          class="absolute inset-0 select-none"
          mix={heroSky}
        />
        <Noise baseFrequency="0.75" numOctaves={3} opacity={0.8} seed={7} />
        <div
          aria-hidden="true"
          class="absolute inset-0 select-none opacity-80"
          mix={heroGrid}
        />
        <RealisticCloud />
        <div
          aria-hidden="true"
          class="pointer-events-none absolute inset-0 select-none"
          mix={heroWash}
        />
        <div
          aria-hidden="true"
          class="pointer-events-none absolute top-0 right-0 transform-gpu select-none"
          mix={heroLightRays}
        />

        <div
          class="relative z-10 mx-auto flex w-full max-w-8xl items-center justify-center px-5 py-10 sm:px-10 sm:py-16 lg:px-16 lg:py-20"
          mix={heroViewport}
        >
          <article
            class="w-full max-w-5xl origin-top transform-gpu bg-card px-6 py-8 text-card-foreground opacity-100 shadow-lg transition duration-700 ease-out motion-reduce:transition-none sm:px-10 sm:py-11 lg:px-12 lg:py-12"
            mix={heroCardEntrance}
          >
            <h1
              id="hero-title"
              class="max-w-4xl font-display text-4xl text-primary leading-none sm:text-5xl lg:text-6xl"
            >
              {copy.titleBeforeImage}{" "}
              <a
                href="https://github.com/Niapya"
                target="_blank"
                rel="noreferrer"
                aria-label={copy.githubLabel}
                class="inline-flex cursor-pointer select-none rounded-sm align-middle focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              >
                <img
                  src={GITHUB_AVATAR_URL}
                  alt=""
                  aria-hidden="true"
                  width="48"
                  height="48"
                  loading="eager"
                  decoding="async"
                  class="mx-0.5 inline-block aspect-square h-10 w-10 rounded-sm border border-primary/15 object-cover align-middle transition duration-300 hover:scale-105 sm:h-12 sm:w-12"
                />
              </a>{" "}
              {copy.titleAfterImage}
            </h1>
            <footer class="mt-9 flex flex-col items-center gap-2 border-border border-t pt-4 font-sans text-muted-foreground text-sm leading-6 sm:mt-11 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:text-base">
              {copy.footerLead}
              <span class="flex items-center text-foreground/70">
                <span class="group inline-flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    class="inline-flex h-5 w-5 shrink-0 -translate-x-1 -rotate-12 select-none items-center justify-center leading-none opacity-0 transition duration-300 ease-out group-hover:translate-x-0 group-hover:rotate-0 group-hover:opacity-100 motion-reduce:transform-none motion-reduce:transition-none"
                  >
                    <Icon name="lucide:pencil" className="h-4 w-4" />
                  </span>
                  <a
                    href="https://github.com/Niapya"
                    target="_blank"
                    rel="noreferrer"
                    class="inline-flex h-6 w-14 cursor-pointer select-none items-center justify-center font-normal underline-offset-4 transition-all duration-300 ease-out hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring group-hover:font-semibold motion-reduce:transition-none"
                  >
                    {copy.name}
                  </a>
                </span>
                <span aria-hidden="true" class="mx-2 text-foreground/35">
                  /
                </span>
                <span class="group inline-flex items-center gap-2">
                  <span class="inline-flex h-6 w-12 items-center justify-center font-normal transition-all duration-300 ease-out group-hover:font-semibold motion-reduce:transition-none">
                    {copy.location}
                  </span>
                  <span
                    aria-hidden="true"
                    class="inline-flex h-5 w-5 shrink-0 translate-x-1 scale-75 select-none items-center justify-center leading-none opacity-0 transition duration-300 ease-out group-hover:translate-x-0 group-hover:scale-100 group-hover:opacity-100 motion-reduce:transform-none motion-reduce:transition-none"
                  >
                    <Icon name="lucide:heart" className="h-4 w-4" />
                  </span>
                </span>
              </span>
            </footer>
          </article>
        </div>
      </section>
    );
  };
}
