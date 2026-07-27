import { css, type Handle } from "remix/ui";

import { createDomId } from "@/utils/id.ts";

type RealisticCloudProps = Record<string, never>;

const cloudDrift = css({
  animation: "realistic-cloud-drift 20s ease-in-out infinite",
  "@keyframes realistic-cloud-drift": {
    from: { transform: "translate3d(-1rem, 0, 0)" },
    "50%": { transform: "translate3d(1rem, -1rem, 0)" },
    to: { transform: "translate3d(-1rem, 0, 0)" },
  },
  "@media (prefers-reduced-motion: reduce)": {
    animation: "none",
  },
});

/** Renders a layered, noise-displaced cloud without client-side JavaScript. */
export function RealisticCloud(handle: Handle<RealisticCloudProps>) {
  const backFilter = createDomId("cloud", handle.id, "back-filter");
  const middleFilter = createDomId("cloud", handle.id, "middle-filter");
  const frontFilter = createDomId("cloud", handle.id, "front-filter");
  const backFill = createDomId("cloud", handle.id, "back-fill");
  const middleFill = createDomId("cloud", handle.id, "middle-fill");
  const frontFill = createDomId("cloud", handle.id, "front-fill");

  return () => (
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 select-none overflow-hidden"
    >
      <svg
        class="absolute top-0 left-1/4 ml-8 h-auto w-3/4 max-w-3xl transform-gpu opacity-70 mix-blend-screen dark:opacity-40"
        mix={cloudDrift}
        viewBox="0 0 900 450"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id={backFill} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="0.65" stopColor="#e8f2f8" stopOpacity="0.3" />
            <stop offset="1" stopColor="#bad0dc" stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id={middleFill} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.72" />
            <stop offset="0.7" stopColor="#edf6fa" stopOpacity="0.46" />
            <stop offset="1" stopColor="#c7dce6" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id={frontFill} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="0.68" stopColor="#f4f9fb" stopOpacity="0.68" />
            <stop offset="1" stopColor="#d8e8ef" stopOpacity="0.32" />
          </linearGradient>

          <filter id={backFilter} x="-30%" y="-50%" width="160%" height="200%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.006 0.012"
              numOctaves="4"
              seed="11"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="86"
              xChannelSelector="R"
              yChannelSelector="B"
              result="displaced"
            />
            <feGaussianBlur in="displaced" stdDeviation="10" />
          </filter>
          <filter
            id={middleFilter}
            x="-30%"
            y="-50%"
            width="160%"
            height="200%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.008 0.015"
              numOctaves="3"
              seed="17"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="68"
              xChannelSelector="G"
              yChannelSelector="B"
              result="displaced"
            />
            <feGaussianBlur in="displaced" stdDeviation="6" />
          </filter>
          <filter id={frontFilter} x="-30%" y="-50%" width="160%" height="200%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.01 0.018"
              numOctaves="2"
              seed="23"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="48"
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />
            <feGaussianBlur in="displaced" stdDeviation="3" />
          </filter>
        </defs>

        <g filter={`url(#${backFilter})`} fill={`url(#${backFill})`}>
          <ellipse cx="450" cy="280" rx="330" ry="86" />
          <ellipse cx="255" cy="250" rx="135" ry="100" />
          <ellipse cx="430" cy="205" rx="195" ry="135" />
          <ellipse cx="625" cy="245" rx="150" ry="108" />
        </g>
        <g filter={`url(#${middleFilter})`} fill={`url(#${middleFill})`}>
          <ellipse cx="450" cy="270" rx="300" ry="82" />
          <ellipse cx="300" cy="238" rx="138" ry="102" />
          <ellipse cx="455" cy="195" rx="178" ry="126" />
          <ellipse cx="610" cy="235" rx="132" ry="94" />
        </g>
        <g filter={`url(#${frontFilter})`} fill={`url(#${frontFill})`}>
          <ellipse cx="450" cy="260" rx="270" ry="76" />
          <ellipse cx="330" cy="228" rx="126" ry="94" />
          <ellipse cx="480" cy="195" rx="152" ry="110" />
          <ellipse cx="600" cy="230" rx="112" ry="82" />
        </g>
      </svg>
    </div>
  );
}
