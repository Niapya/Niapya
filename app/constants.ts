export const APP_NAME = "Niapya";

export const SITE_METADATA = {
  siteName: APP_NAME,
  canonicalPath: "/",
  title: {
    en: "Niapya | Independent Designer and Developer",
    "zh-cn": "Niapya | 独立设计师与开发者",
  },
  description: {
    en:
      "A personal portfolio of thoughtful digital products, interfaces, and experiments.",
    "zh-cn": "记录数字产品、界面与实验的个人作品集。",
  },
  keywords: {
    en: [
      "Niapya",
      "portfolio",
      "independent designer",
      "developer",
      "digital products",
    ],
    "zh-cn": [
      "Niapya",
      "作品集",
      "独立设计师",
      "开发者",
      "数字产品",
    ],
  },
  author: APP_NAME,
  themeColor: "#f4f1eb",
  robots: "index, follow",
  favicon: "/favicon.svg",
  ogImage: "/og-image.png",
  manifest: "/manifest.webmanifest",
  robotsFile: "/robots.txt",
  sitemap: "/sitemap.xml",
  openGraph: {
    type: "website",
  },
  twitter: {
    card: "summary",
  },
} as const;
