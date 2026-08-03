import { X } from "lucide";
import { css, type Handle, type RemixNode } from "remix/ui";

import { Icon } from "@/components/icon.tsx";

export type PopoverProps = {
  /** Visible content for the button that opens and closes the popover. */
  trigger: RemixNode;
  /** Gives the popover an accessible name and visible heading. */
  title: string;
  children?: RemixNode;
  /** Supplies a stable target id when an external reference is needed. */
  id?: string;
  closeLabel?: string;
  class?: string;
  triggerClass?: string;
};

const panelStyle = css({
  boxSizing: "border-box",
  inlineSize: "min(30rem, calc(100vw - 2rem))",
  maxBlockSize: "min(42rem, calc(100vh - 2rem))",
  overflow: "auto",
  border: "1px solid var(--border)",
  borderRadius: "0.25rem",
  backgroundColor: "var(--popover)",
  color: "var(--popover-foreground)",
  boxShadow: "0 1.5rem 4rem rgb(0 0 0 / 18%)",
  padding: "1.25rem",
  "&:popover-open": {
    animation: "popover-enter 160ms ease-out",
  },
  "@keyframes popover-enter": {
    from: { opacity: "0", transform: "translateY(0.5rem) scale(0.985)" },
  },
  "@media (prefers-reduced-motion: reduce)": {
    "&:popover-open": { animation: "none" },
  },
});

/**
 * A progressively enhanced, non-modal overlay powered by the native Popover
 * API. `popover=\"auto\"` supplies Escape and light-dismiss behavior without
 * a client-side runtime.
 */
export function Popover(handle: Handle<PopoverProps>) {
  return () => {
    const targetId = handle.props.id ?? `${handle.id}-popover`;
    const titleId = `${targetId}-title`;
    const closeLabel = handle.props.closeLabel ?? "Close";

    return (
      <span class="inline-flex">
        <button
          type="button"
          popovertarget={targetId}
          class={handle.props.triggerClass ?? ""}
        >
          {handle.props.trigger}
        </button>
        <section
          id={targetId}
          popover="auto"
          aria-labelledby={titleId}
          class={handle.props.class ?? ""}
          mix={panelStyle}
        >
          <div class="flex items-start justify-between gap-6 border-b border-border pb-4">
            <h2 id={titleId} class="font-display text-2xl leading-none">
              {handle.props.title}
            </h2>
            <button
              type="button"
              popovertarget={targetId}
              popovertargetaction="hide"
              aria-label={closeLabel}
              title={closeLabel}
              class="-mt-1 -mr-1 inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-sm text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon icon={X} className="h-4 w-4" />
            </button>
          </div>
          <div class="pt-5">{handle.props.children}</div>
        </section>
      </span>
    );
  };
}
