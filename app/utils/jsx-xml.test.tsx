import assert from "node:assert/strict";

import { buildXml } from "./jsx-xml.ts";

Deno.test("buildXml serializes JSX with XML escaping", () => {
  const xml = buildXml(
    <>
      <rss version="2.0">
        <channel>
          <title>{'Niapya & <feed> "notes"'}</title>
          <guid isPermaLink>https://example.com/blog?a=1&amp;b=2</guid>
        </channel>
      </rss>
    </>,
  );

  assert.equal(
    xml,
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<rss version="2.0"><channel><title>Niapya &amp; &lt;feed&gt; &quot;notes&quot;</title>' +
      '<guid isPermaLink="true">https://example.com/blog?a=1&amp;b=2</guid></channel></rss>',
  );
});

Deno.test("buildXml preserves false XML attribute values", () => {
  assert.equal(
    buildXml(<guid isPermaLink={false}>entry</guid>),
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<guid isPermaLink="false">entry</guid>',
  );
});

Deno.test("buildXml rejects non-scalar attributes", () => {
  assert.throws(
    () => buildXml(<rss metadata={{ version: 2 }}></rss>),
    /XML attributes must be scalar values/,
  );
});
