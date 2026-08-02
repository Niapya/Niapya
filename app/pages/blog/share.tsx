import { type IconNode, Mail, MessageSquareText, Share2 } from "lucide";
import { css, type Handle } from "remix/ui";
import facebookSvg from "simple-icons/icons/facebook.svg" with { type: "text" };
import lineSvg from "simple-icons/icons/line.svg" with { type: "text" };
import qqSvg from "simple-icons/icons/qq.svg" with { type: "text" };
import qzoneSvg from "simple-icons/icons/qzone.svg" with { type: "text" };
import redditSvg from "simple-icons/icons/reddit.svg" with { type: "text" };
import sinaweiboSvg from "simple-icons/icons/sinaweibo.svg" with {
  type: "text",
};
import telegramSvg from "simple-icons/icons/telegram.svg" with { type: "text" };
import whatsappSvg from "simple-icons/icons/whatsapp.svg" with { type: "text" };
import xSvg from "simple-icons/icons/x.svg" with { type: "text" };
import ycombinatorSvg from "simple-icons/icons/ycombinator.svg" with {
  type: "text",
};
import { BrandIcon } from "@/components/brand-icon.tsx";
import { Icon } from "@/components/icon.tsx";
import { createShareLinks, type SharePlatform } from "@/utils/share.ts";

type ShareMenuProps = {
  url: string;
  title: string;
  copy: {
    share: string;
    shareLabel: string;
  };
};

type PlatformIcon = {
  svg?: string;
  lucide?: IconNode;
};

const PLATFORM_ICONS: Record<SharePlatform, PlatformIcon> = {
  email: { lucide: Mail },
  sms: { lucide: MessageSquareText },
  telegram: { svg: telegramSvg },
  whatsapp: { svg: whatsappSvg },
  line: { svg: lineSvg },
  x: { svg: xSvg },
  facebook: { svg: facebookSvg },
  reddit: { svg: redditSvg },
  "hacker-news": { svg: ycombinatorSvg },
  weibo: { svg: sinaweiboSvg },
  qq: { svg: qqSvg },
  qzone: { svg: qzoneSvg },
};

const shareTooltipStyle = css({
  "& [data-share-tooltip]": {
    left: "0",
    right: "auto",
  },
  "@media (min-width: 42rem)": {
    "& [data-share-tooltip]": {
      left: "auto",
      right: "0",
    },
  },
});

export function ShareMenu(handle: Handle<ShareMenuProps>) {
  return () => {
    const links = createShareLinks({
      url: handle.props.url,
      title: handle.props.title,
    });

    return (
      <span class="group relative inline-flex" mix={shareTooltipStyle}>
        <button
          type="button"
          aria-label={handle.props.copy.shareLabel}
          class="inline-flex cursor-pointer select-none items-center gap-1.5 border-0 bg-transparent p-0 font-mono text-muted-foreground text-xs uppercase outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Icon icon={Share2} className="h-3.5 w-3.5" />
          {handle.props.copy.share}
        </button>
        <div
          data-share-tooltip
          class="invisible absolute bottom-full z-20 w-max translate-y-1 pb-2 opacity-0 transition-all duration-200 ease-out group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100"
        >
          <div class="rounded-sm border border-border bg-popover p-2 text-popover-foreground shadow-md">
            <ul class="m-0 grid list-none grid-cols-5 gap-1 p-0">
              {links.map((link) => {
                const external = link.href.startsWith("http");
                return (
                  <li key={link.platform}>
                    <a
                      href={link.href}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noreferrer" : undefined}
                      aria-label={link.label}
                      title={link.label}
                      class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground"
                    >
                      {renderPlatformIcon(link.platform)}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </span>
    );
  };
}

function renderPlatformIcon(platform: SharePlatform) {
  const icon = PLATFORM_ICONS[platform];
  if (icon.svg) {
    return <BrandIcon svg={icon.svg} className="block h-4 w-4" />;
  }
  return <Icon icon={icon.lucide ?? Mail} className="h-4 w-4" />;
}
