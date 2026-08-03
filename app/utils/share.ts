export type SharePlatform =
  | "email"
  | "sms"
  | "telegram"
  | "whatsapp"
  | "line"
  | "x"
  | "facebook"
  | "reddit"
  | "hacker-news"
  | "weibo"
  | "qq"
  | "qzone";

export type ShareLink = {
  platform: SharePlatform;
  label: string;
  href: string;
};

type ShareInput = {
  url: string;
  title: string;
};

type ShareTarget = {
  platform: SharePlatform;
  label: string;
  href: (input: ShareInput) => string;
};

const SHARE_TARGETS: readonly ShareTarget[] = [
  {
    platform: "email",
    label: "Email",
    href: ({ url, title }) =>
      `mailto:?subject=${encode(title)}&body=${encode(url)}`,
  },
  {
    platform: "sms",
    label: "SMS",
    href: ({ url, title }) => `sms:?body=${encode(`${title}\n${url}`)}`,
  },
  {
    platform: "telegram",
    label: "Telegram",
    href: ({ url, title }) =>
      `https://t.me/share/url?url=${encode(url)}&text=${encode(title)}`,
  },
  {
    platform: "whatsapp",
    label: "WhatsApp",
    href: ({ url, title }) =>
      `https://api.whatsapp.com/send?text=${encode(`${title} ${url}`)}`,
  },
  {
    platform: "line",
    label: "LINE",
    href: ({ url, title }) =>
      `https://line.me/R/share?text=${encode(`${title} ${url}`)}`,
  },
  {
    platform: "x",
    label: "X",
    href: ({ url, title }) =>
      `https://twitter.com/intent/tweet?text=${encode(title)}&url=${encode(url)
      }`,
  },
  {
    platform: "facebook",
    label: "Facebook",
    href: ({ url }) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encode(url)}`,
  },
  {
    platform: "reddit",
    label: "Reddit",
    href: ({ url, title }) =>
      `https://www.reddit.com/submit?url=${encode(url)}&title=${encode(title)}`,
  },
  {
    platform: "hacker-news",
    label: "Hacker News",
    href: ({ url, title }) =>
      `https://news.ycombinator.com/submitlink?u=${encode(url)}&t=${encode(title)
      }`,
  },
  {
    platform: "weibo",
    label: "Weibo",
    href: ({ url, title }) =>
      `https://service.weibo.com/share/share.php?url=${encode(url)}&title=${encode(title)
      }`,
  },
  {
    platform: "qq",
    label: "QQ",
    href: ({ url, title }) =>
      `https://connect.qq.com/widget/shareqq/index.html?url=${encode(url)
      }&title=${encode(title)}`,
  },
  {
    platform: "qzone",
    label: "QZone",
    href: ({ url }) =>
      `https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${encode(url)
      }`,
  },
];

/**
 * Generate share links for various platforms based on the provided URL and title.
 */
export function createShareLinks(input: ShareInput): ShareLink[] {
  return SHARE_TARGETS.map(({ platform, label, href }) => ({
    platform,
    label,
    href: href(input),
  }));
}

function encode(value: string): string {
  return encodeURIComponent(value);
}
