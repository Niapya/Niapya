import assert from "node:assert/strict";

import { renderMarkdownDocument } from "./markdown.ts";

Deno.test("renderMarkdownDocument returns weighted sections with rendered heading ids", () => {
  const document = renderMarkdownDocument(`
Lead paragraph.

## First section

One two three four five six seven.

## First section

更短的内容。
`);

  assert.match(document.html, /<h2 id="first-section">/);
  assert.match(document.html, /<h2 id="first-section-1">/);
  assert.equal(document.sections.length, 2);
  assert.deepEqual(
    document.sections.map(({ id, title, depth }) => ({ id, title, depth })),
    [
      { id: "first-section", title: "First section", depth: 2 },
      { id: "first-section-1", title: "First section", depth: 2 },
    ],
  );
  assert.ok(document.leadWordCount > 0);
  assert.ok(document.sections[0].wordCount > document.sections[1].wordCount);
});

Deno.test("renderMarkdownDocument isolates code blocks from prose styles", () => {
  const fencedCode = [
    "```ts",
    'const message = "readable";',
    "```",
    "",
    "```",
    "plain text",
    "```",
  ].join("\n");
  const document = renderMarkdownDocument(fencedCode);

  assert.match(
    document.html,
    /class="not-prose highlight [^"]*bg-muted[^"]*highlight-source-ts notranslate"/,
  );
  assert.match(
    document.html,
    /<pre class="not-prose [^"]*font-mono text-sm[^"]*"><code>/,
  );
});
