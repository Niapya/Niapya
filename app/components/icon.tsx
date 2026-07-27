import type { IconNode } from "lucide";
import type { Handle } from "remix/ui";

type IconProps = {
  icon: IconNode;
  className?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
};

export function Icon(handle: Handle<IconProps>) {
  return () => (
    <svg
      aria-hidden="true"
      class={`select-none ${handle.props.className ?? ""}`}
      viewBox="0 0 24 24"
      fill={handle.props.fill ?? "none"}
      stroke={handle.props.stroke ?? "currentColor"}
      stroke-width={handle.props.strokeWidth ?? 2}
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      {handle.props.icon.map(([tag, attributes], index) => {
        switch (tag) {
          case "circle":
            return <circle key={`icon-${index}`} {...attributes} />;
          case "line":
            return <line key={`icon-${index}`} {...attributes} />;
          case "path":
            return <path key={`icon-${index}`} {...attributes} />;
          case "polygon":
            return <polygon key={`icon-${index}`} {...attributes} />;
          case "polyline":
            return <polyline key={`icon-${index}`} {...attributes} />;
          case "rect":
            return <rect key={`icon-${index}`} {...attributes} />;
          default:
            return null;
        }
      })}
    </svg>
  );
}
