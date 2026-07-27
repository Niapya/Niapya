import {
  KATEX_CSS,
  Marked,
  render,
  Renderer,
  stripSplitBySections,
} from "@deno/gfm";
import "prismjs/components/prism-bash.js";
import "prismjs/components/prism-jsx.js";
import "prismjs/components/prism-typescript.js";
import "prismjs/components/prism-tsx.js";

import { createUniqueSlugger } from "./slug.ts";

export const MARKDOWN_HEAD_CSS = KATEX_CSS;

export type MarkdownSection = {
  id: string;
  title: string;
  depth: number;
  wordCount: number;
};

export type MarkdownDocument = {
  html: string;
  leadWordCount: number;
  sections: readonly MarkdownSection[];
};

type RenderedHeading = Pick<MarkdownSection, "id" | "depth">;

const wordSegmenter = new Intl.Segmenter(undefined, {
  granularity: "word",
});

class SectionRenderer extends Renderer {
  readonly headings: RenderedHeading[] = [];
  readonly #uniqueSlug = createUniqueSlugger("section");

  override heading(token: Marked.Tokens.Heading): string {
    const id = this.#uniqueSlug(token.text);
    const html = super.heading(token).replace(
      /^<h(\d) id="[^"]+">/,
      `<h$1 id="${id}">`,
    );

    this.headings.push({ id, depth: token.depth });

    return html;
  }
}

export function renderMarkdown(markdown: string): string {
  return isolateCodeBlocks(render(markdown, { allowMath: true }));
}

export function renderMarkdownDocument(markdown: string): MarkdownDocument {
  const plaintextSections = stripSplitBySections(markdown, {
    allowMath: true,
  });
  const renderer = new SectionRenderer({ allowMath: true });
  const html = isolateCodeBlocks(
    render(markdown, { allowMath: true, renderer }),
  );

  return {
    html,
    leadWordCount: countWords(plaintextSections[0]?.content ?? ""),
    sections: renderer.headings.map((heading, index) => {
      const section = plaintextSections[index + 1];
      return {
        ...heading,
        title: section?.header.trim() || heading.id,
        wordCount: countWords(section?.content ?? ""),
      };
    }),
  };
}

function isolateCodeBlocks(html: string): string {
  return html
    .replaceAll(
      '<div class="highlight ',
      '<div class="not-prose highlight my-8 max-w-full overflow-hidden rounded border border-border bg-muted text-foreground ',
    )
    .replaceAll(
      "<pre>",
      '<pre class="not-prose m-0 max-w-full overflow-x-auto bg-muted p-5 font-mono text-sm text-foreground leading-6">',
    );
}

function countWords(value: string): number {
  let count = 0;

  for (const segment of wordSegmenter.segment(value)) {
    if (segment.isWordLike) count += 1;
  }

  return Math.max(count, 1);
}
