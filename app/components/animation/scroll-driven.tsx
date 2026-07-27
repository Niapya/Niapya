import { css, type Handle, type RemixNode } from "remix/ui";

export type ScrollDrivenTimeline = string;

export type ScrollDrivenKeyframe = Record<string, string | number>;

export type ScrollDrivenKeyframes = Record<string, ScrollDrivenKeyframe>;

export type ScrollDrivenAnimationProps = {
  children?: RemixNode;
  class?: string;
  /** CSS scroll progress timeline, for example `view(block)` or `scroll(root block)`. */
  timeline?: ScrollDrivenTimeline;
  /** Timeline range, for example `entry 0% cover 40%`. */
  range?: string;
  /** Non-zero duration required for scroll-driven animation interpolation. */
  duration?: string;
  easing?: string;
  keyframes: ScrollDrivenKeyframes;
};

function animationIdentifier(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function animationHash(value: string): string {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

/**
 * Applies a CSS scroll-driven animation timeline to a server-rendered wrapper.
 *
 * `view()` is the default because it follows the element through its nearest
 * scrollport. Pass `scroll()` when the animation should follow scroll progress
 * instead. The browser controls progress; no client-side runtime is needed.
 */
export function ScrollDrivenAnimation(
  handle: Handle<ScrollDrivenAnimationProps>,
) {
  const {
    children,
    class: className,
    timeline = "view()",
    range = "entry 0% cover 40%",
    duration = "1ms",
    easing = "linear",
    keyframes,
  } = handle.props;
  const animationSignature = JSON.stringify([
    timeline,
    range,
    duration,
    easing,
    keyframes,
  ]);
  const animationName = `rmx-scroll-${animationIdentifier(handle.id)}-${
    animationHash(animationSignature)
  }`;
  const animationStyle = css(
    {
      animationName,
      animationDuration: duration,
      animationTimingFunction: easing,
      animationFillMode: "both",
      animationTimeline: timeline,
      animationRange: range,
      [`@keyframes ${animationName}`]: keyframes,
      "@media (prefers-reduced-motion: reduce)": {
        animation: "none",
      },
    } as Parameters<typeof css>[0],
  );

  return () => (
    <div class={className} mix={animationStyle}>
      {children}
    </div>
  );
}
