import assert from "node:assert/strict";

import { createShareLinks } from "./share.ts";

const links = createShareLinks({
  url: "https://niapya.local/blog/remix-3?lang=zh-cn",
  title: "迁移到 remix@3",
});

Deno.test("createShareLinks covers all platforms in fixed order", () => {
  assert.deepEqual(
    links.map((link) => link.platform),
    [
      "email",
      "sms",
      "telegram",
      "whatsapp",
      "line",
      "x",
      "facebook",
      "reddit",
      "hacker-news",
      "weibo",
      "qq",
      "qzone",
    ],
  );
});

Deno.test("createShareLinks encodes url and title as query parameters", () => {
  const byPlatform = new Map(links.map((link) => [link.platform, link.href]));

  assert.equal(
    byPlatform.get("email"),
    "mailto:?subject=%E8%BF%81%E7%A7%BB%E5%88%B0%20remix%403&body=https%3A%2F%2Fniapya.local%2Fblog%2Fremix-3%3Flang%3Dzh-cn",
  );
  assert.equal(
    byPlatform.get("sms"),
    "sms:?body=%E8%BF%81%E7%A7%BB%E5%88%B0%20remix%403%0Ahttps%3A%2F%2Fniapya.local%2Fblog%2Fremix-3%3Flang%3Dzh-cn",
  );
  assert.equal(
    byPlatform.get("telegram"),
    "https://t.me/share/url?url=https%3A%2F%2Fniapya.local%2Fblog%2Fremix-3%3Flang%3Dzh-cn&text=%E8%BF%81%E7%A7%BB%E5%88%B0%20remix%403",
  );
  assert.equal(
    byPlatform.get("x"),
    "https://twitter.com/intent/tweet?text=%E8%BF%81%E7%A7%BB%E5%88%B0%20remix%403&url=https%3A%2F%2Fniapya.local%2Fblog%2Fremix-3%3Flang%3Dzh-cn",
  );
  assert.equal(
    byPlatform.get("facebook"),
    "https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fniapya.local%2Fblog%2Fremix-3%3Flang%3Dzh-cn",
  );
});
