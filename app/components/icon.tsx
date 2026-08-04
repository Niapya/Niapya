import { css, type Handle } from "remix/ui";

const ICONIFY_CDN = "https://api.iconify.design";

type IconProps = {
  name: string;
  className?: string;
  color?: string;
};

const iconSizeStyle = css({
  display: "inline-block",
  width: "1em",
  height: "1em",
});

export function Icon(handle: Handle<IconProps>) {
  return () => {
    const maskImage = `url("${ICONIFY_CDN}/${handle.props.name}.svg")`;
    return (
      <span
        aria-hidden="true"
        class={`select-none ${handle.props.className ?? ""}`}
        style={{
          color: handle.props.color,
          backgroundColor: "currentColor",
          maskImage,
          WebkitMaskImage: maskImage,
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskSize: "100% 100%",
          WebkitMaskSize: "100% 100%",
        }}
        mix={iconSizeStyle}
      />
    );
  };
}
