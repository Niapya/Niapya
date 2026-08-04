import type { Handle } from "remix/ui";

import {
  createI18n,
  DEFAULT_LANG,
  type I18n,
  localizeHref,
} from "@/i18n/index.ts";
import { routes } from "@/routes.ts";
import { ScrollDrivenAnimation } from "@/components/animation/scroll-driven.tsx";
import { Icon } from "@/components/icon.tsx";
import { SITE_NAVIGATION } from "@/constants/index.ts";
import { createDomId } from "@/utils/id.ts";

type FriendLink = {
  title: string;
  href: string;
  image: string;
};

const FRIEND_LINKS = [] as const satisfies readonly FriendLink[];

type FriendLinksProps = {
  links: readonly FriendLink[];
  i18n: I18n;
};

type FooterProps = {
  i18n?: I18n;
};

function FriendLinks(handle: Handle<FriendLinksProps>) {
  return () => {
    const copy = handle.props.i18n.messages.home.footer;

    return (
      <nav aria-label={copy.friendLinks} class="flex shrink-0 self-end">
        <ul class="flex -space-x-2">
          {handle.props.links.map((friend, index) => {
            const tooltipId = createDomId("friend-tooltip", index);

            return (
              <li key={friend.href} class="relative">
                <a
                  href={friend.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-describedby={tooltipId}
                  class="group relative block h-8 w-8 cursor-pointer select-none rounded-full ring-2 ring-black transition duration-500 ease-out hover:z-10 hover:-translate-y-1 hover:scale-110 focus-visible:z-10 focus-visible:-translate-y-1 focus-visible:scale-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transition-none sm:h-12 sm:w-12"
                >
                  <img
                    src={friend.image}
                    alt={friend.title}
                    width="48"
                    height="48"
                    loading="lazy"
                    decoding="async"
                    class="h-full w-full rounded-full object-cover"
                  />
                  <span
                    id={tooltipId}
                    role="tooltip"
                    class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 translate-y-1 select-none whitespace-nowrap border-b border-white/40 pb-1 font-display text-lg text-white italic opacity-0 transition duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 motion-reduce:transition-none"
                  >
                    {friend.title}
                  </span>
                </a>
              </li>
            );
          })}
          <li class="relative">
            <a
              href={localizeHref(
                routes.comments.index.href(),
                handle.props.i18n.lang,
              )}
              aria-label={copy.applyFriendLink}
              aria-describedby="friend-application-tooltip"
              class="group relative flex h-8 w-8 cursor-pointer select-none items-center justify-center rounded-full border border-dashed border-white/50 bg-black text-white transition duration-500 ease-out hover:z-10 hover:-translate-y-1 hover:border-white focus-visible:z-10 focus-visible:-translate-y-1 focus-visible:border-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transition-none sm:h-12 sm:w-12"
            >
              <Icon name="lucide:plus" className="h-4 w-4 sm:h-5 sm:w-5" />
              <span
                id="friend-application-tooltip"
                role="tooltip"
                class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 translate-y-1 select-none whitespace-nowrap border-b border-white/40 pb-1 font-display text-lg text-white italic opacity-0 transition duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 motion-reduce:transition-none"
              >
                {copy.applyViaComments}
              </span>
            </a>
          </li>
        </ul>
      </nav>
    );
  };
}

export function Footer(handle: Handle<FooterProps>) {
  return () => {
    const i18n = handle.props.i18n ?? createI18n(DEFAULT_LANG);
    const copy = i18n.messages.home.footer;
    const nav = i18n.messages.nav;

    return (
      <footer
        id="site-footer"
        aria-labelledby="footer-title"
        class="sticky bottom-0 z-0 h-96 overflow-hidden bg-black text-white"
      >
        <ScrollDrivenAnimation
          class="block"
          range="entry 0% entry 90%"
          keyframes={{
            from: { opacity: 0.45, transform: "translateY(12%)" },
            to: { opacity: 1, transform: "translateY(0)" },
          }}
        >
          <div class="mx-auto flex h-96 w-full max-w-8xl flex-col justify-between px-5 py-4 sm:px-10 sm:py-6 lg:px-16">
            <div class="flex items-start justify-between gap-8 border-b border-white/20 pb-3">
              <a
                href="#contact"
                class="relative inline-block cursor-pointer select-none font-display text-3xl text-white leading-none after:absolute after:inset-x-0 after:-bottom-1 after:h-1 after:origin-left after:scale-x-0 after:bg-white after:transition-transform after:duration-700 after:ease-out hover:after:scale-x-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white focus-visible:after:scale-x-100 motion-reduce:after:transition-none sm:text-4xl"
              >
                {copy.hire} <span class="italic">{copy.me}</span>
              </a>
              <a
                href="#top"
                aria-label={copy.backToTop}
                class="inline-flex h-10 w-12 shrink-0 cursor-pointer select-none items-center justify-center rounded-full border border-white/35 text-xl leading-none transition-colors hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                <Icon name="lucide:arrow-up" className="h-5 w-5" />
              </a>
            </div>

            <div
              data-footer-main-row
              class="flex items-end justify-between gap-4 py-6 sm:py-8"
            >
              <h2
                id="footer-title"
                class="min-w-0 font-display text-4xl leading-none sm:text-6xl lg:text-7xl"
              >
                {copy.titleLineOne}
                <span class="block text-white italic">{copy.titleLineTwo}</span>
              </h2>
              <FriendLinks links={FRIEND_LINKS} i18n={i18n} />
            </div>

            <div class="flex flex-col gap-3 border-t border-white/20 pt-3 sm:flex-row sm:items-end sm:justify-between">
              <nav aria-label={copy.navigation}>
                <ul class="flex flex-wrap gap-x-6 gap-y-3 font-sans text-sm">
                  {SITE_NAVIGATION.map((link) => (
                    <li key={link.id}>
                      <a
                        href={localizeHref(link.href, i18n.lang)}
                        class="relative inline-block cursor-pointer select-none after:absolute after:inset-x-0 after:-bottom-1 after:h-1 after:origin-left after:scale-x-0 after:bg-white after:transition-transform after:duration-500 after:ease-out hover:after:scale-x-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white focus-visible:after:scale-x-100 motion-reduce:after:transition-none"
                      >
                        {nav[link.id]}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
              <p class="font-serif text-white/50 text-xs italic tracking-wide">
                {copy.remixCredit.beforeRemix}
                <a
                  href="https://remix.run"
                  class="cursor-pointer select-none text-white/70 underline decoration-white/30 underline-offset-2 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Remix
                </a>
                {copy.remixCredit.afterRemix}
              </p>
            </div>
          </div>
        </ScrollDrivenAnimation>
      </footer>
    );
  };
}
