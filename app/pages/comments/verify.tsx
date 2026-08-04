import type { Handle } from "remix/ui";

import type { SiteNavigationId } from "@/constants/index.ts";
import type { CommentCaptchaChallenge } from "@/data/comment-captcha.ts";
import type { I18n } from "@/i18n/index.ts";
import { Header } from "@/components/header.tsx";
import { Icon } from "@/components/icon.tsx";

type CommentVerificationPageProps = {
  i18n: I18n;
  current: SiteNavigationId;
  action: string;
  backHref: string;
  challenge: CommentCaptchaChallenge;
  eyebrow: string;
  title: string;
  description: string;
  captchaAlt: string;
  backLabel: string;
  error?: string;
};

export function CommentVerificationPage(
  handle: Handle<CommentVerificationPageProps>,
) {
  return () => {
    const props = handle.props;

    return (
      <div class="min-h-screen bg-background text-foreground">
        <Header current={props.current} i18n={props.i18n} />

        <main class="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-5 py-20 sm:px-10 lg:px-20">
          <a
            href={props.backHref}
            class="mb-10 inline-flex w-fit cursor-pointer select-none items-center gap-2 text-muted-foreground text-sm outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Icon name="lucide:arrow-left" className="h-4 w-4" />
            {props.backLabel}
          </a>

          <section aria-labelledby="verification-title">
            <p class="mb-4 font-mono text-primary text-xs uppercase">
              {props.eyebrow}
            </p>
            <h1
              id="verification-title"
              class="max-w-3xl font-display text-5xl leading-none sm:text-6xl"
            >
              {props.title}
            </h1>
            <p class="mt-6 max-w-xl text-muted-foreground leading-7">
              {props.description}
            </p>

            {props.error && (
              <p
                class="mt-8 border-destructive border-l-4 bg-red-50 px-5 py-4 text-red-950 text-sm dark:bg-red-950 dark:text-red-100"
                role="alert"
              >
                {props.error}
              </p>
            )}

            <form method="post" action={props.action} class="mt-10">
              <input
                type="hidden"
                name="captchaToken"
                value={props.challenge.token}
              />
              <fieldset class="border-border border-y py-8">
                <legend class="sr-only">{props.title}</legend>
                <input
                  type="image"
                  name="captcha"
                  src={props.challenge.image}
                  width={props.challenge.width}
                  height={props.challenge.height}
                  alt={props.captchaAlt}
                  class="block h-48 w-72 cursor-pointer select-none border border-border bg-transparent object-contain p-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:ring-offset-background focus-visible:ring-ring"
                />
              </fieldset>
            </form>
          </section>
        </main>
      </div>
    );
  };
}
