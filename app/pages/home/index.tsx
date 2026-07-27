import { css, type Handle } from "remix/ui";

import { createI18n, DEFAULT_LANG, type I18n } from "@/i18n/index.ts";
import { Header } from "@/components/header.tsx";
import { Contact } from "./contact.tsx";
import { Comments } from "./comments.tsx";
import { Designer } from "./designer.tsx";
import { Developer } from "./developer.tsx";
import { Footer } from "./footer.tsx";
import { Hero } from "./hero.tsx";

type HomeProps = {
  i18n?: I18n;
};

const mainDrawerStyle = css({
  borderBottomLeftRadius: "clamp(1.5rem, 4vw, 4rem)",
  borderBottomRightRadius: "clamp(1.5rem, 4vw, 4rem)",
});

export function Home(handle: Handle<HomeProps>) {
  return () => {
    const i18n = handle.props.i18n ?? createI18n(DEFAULT_LANG);

    return (
      <div class="relative isolate bg-black">
        <main
          id="top"
          class="relative z-10 overflow-clip bg-background"
          mix={mainDrawerStyle}
        >
          <Header current="home" i18n={i18n} />
          <Hero i18n={i18n} />
          <Designer i18n={i18n} />
          <Developer i18n={i18n} />
          <Comments i18n={i18n} />
          <Contact i18n={i18n} />
        </main>
        <Footer i18n={i18n} />
      </div>
    );
  };
}
