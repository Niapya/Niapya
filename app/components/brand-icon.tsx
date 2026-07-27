import { css, type Handle } from "remix/ui";

type BrandIconProps = {
  svg: string;
  className?: string;
  color?: string;
};

const brandSvgStyle = css({
  "& svg": {
    display: "block",
    inlineSize: "100%",
    blockSize: "100%",
    fill: "currentColor",
  },
});

/** Renders a trusted SVG sourced from the simple-icons npm package. */
export function BrandIcon(handle: Handle<BrandIconProps>) {
  return () => (
    <span
      data-brand-icon
      aria-hidden="true"
      class={handle.props.className}
      style={{ color: handle.props.color }}
      mix={brandSvgStyle}
      innerHTML={handle.props.svg}
    />
  );
}
