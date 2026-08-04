import type { Handle } from "remix/ui";

import {
  createI18n,
  DEFAULT_LANG,
  type I18n,
  localizeHref,
} from "@/i18n/index.ts";
import { routes } from "@/routes.ts";
import { SITE_NAVIGATION, type SiteNavigationId } from "@/constants/index.ts";

type HeaderProps = {
  current: SiteNavigationId;
  i18n?: I18n;
};

export function Header(handle: Handle<HeaderProps>) {
  return () => {
    const i18n = handle.props.i18n ?? createI18n(DEFAULT_LANG);
    const nav = i18n.messages.nav;

    return (
      <header
        id="site-header"
        class="absolute inset-x-0 top-0 z-50 h-20 select-none bg-transparent text-foreground"
      >
        <div class="mx-auto flex h-full w-full max-w-8xl items-center justify-between gap-4 px-5 sm:gap-8 sm:px-10 lg:px-16">
          <a
            href={localizeHref(routes.home.href(), i18n.lang)}
            aria-label={nav.homeLabel}
            class="group relative shrink-0 cursor-pointer font-display text-2xl leading-none after:absolute after:inset-x-0 after:-bottom-2 after:h-1 after:origin-left after:scale-x-0 after:bg-foreground after:transition-transform after:duration-700 after:ease-out hover:after:scale-x-100 focus-visible:outline-2 focus-visible:outline-foreground focus-visible:outline-offset-4 focus-visible:after:scale-x-100 motion-reduce:after:transition-none sm:text-3xl"
          >
            Niapya<span class="italic">.</span>
          </a>

          <nav aria-label={nav.primaryNavigation}>
            <ul class="flex items-center gap-2 sm:gap-6">
              {SITE_NAVIGATION.map((link) => {
                const isCurrent = link.id === handle.props.current;
                const label = nav[link.id];

                return (
                  <li key={link.id}>
                    <a
                      href={localizeHref(link.href, i18n.lang)}
                      aria-current={isCurrent ? "page" : undefined}
                      class="group relative block h-10 cursor-pointer overflow-hidden after:absolute after:inset-x-1 after:bottom-0 after:h-1 after:origin-left after:scale-x-0 after:bg-foreground after:transition-transform after:duration-500 after:ease-out hover:after:scale-x-100 focus-visible:outline-2 focus-visible:outline-foreground focus-visible:outline-offset-2 focus-visible:after:scale-x-100 motion-reduce:after:transition-none"
                    >
                      <span
                        class={`block transition-transform duration-500 ease-out group-hover:-translate-y-10 group-focus-visible:-translate-y-10 motion-reduce:transition-none ${
                          isCurrent ? "-translate-y-10" : ""
                        }`}
                      >
                        <span class="flex h-10 items-center px-1 font-sans text-xs sm:px-2 sm:text-sm">
                          {label}
                        </span>
                        <span
                          aria-hidden="true"
                          class="flex h-10 items-center px-1 font-display text-lg italic sm:px-2 sm:text-xl"
                        >
                          {label}
                        </span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </header>
    );
  };
}
