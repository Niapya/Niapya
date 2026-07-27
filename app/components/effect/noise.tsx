import { css, type Handle } from "remix/ui";

export type NoiseProps = {
  baseFrequency?: string;
  class?: string;
  numOctaves?: number;
  opacity?: number;
  seed?: number;
};

const noiseSurface = css({
  backgroundRepeat: "repeat",
  mixBlendMode: "normal",
});

function noiseTexture(
  baseFrequency: string,
  numOctaves: number,
  opacity: number,
  seed: number,
): string {
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${
    encodeURIComponent(baseFrequency)
  }' numOctaves='${numOctaves}' seed='${seed}' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='${opacity}'/%3E%3C/svg%3E")`;
}

/** Renders an SVG turbulence noise overlay without client-side JavaScript. */
export function Noise(handle: Handle<NoiseProps>) {
  return () => {
    const {
      baseFrequency = "0.75",
      class: className,
      numOctaves = 3,
      opacity = 0.3,
      seed = 0,
    } = handle.props;

    return (
      <div
        aria-hidden="true"
        class={`pointer-events-none absolute inset-0 h-full w-full ${
          className ?? ""
        }`}
        style={{
          backgroundImage: noiseTexture(
            baseFrequency,
            numOctaves,
            opacity,
            seed,
          ),
        }}
        mix={noiseSurface}
      />
    );
  };
}
