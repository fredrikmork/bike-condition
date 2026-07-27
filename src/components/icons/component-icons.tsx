import type { SVGProps } from "react";

/**
 * Hand-drawn bicycle-part icons (Trello #14). Lucide has no cassettes, drop
 * bars or brake rotors, so these follow its visual language instead — 24×24
 * viewBox, stroke 2, round caps, currentColor — and drop in anywhere a lucide
 * icon does.
 */

export type ComponentIconType = (props: SVGProps<SVGSVGElement>) => React.JSX.Element;

function Svg(props: SVGProps<SVGSVGElement> & { children: React.ReactNode }) {
  const { children, ...rest } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

/** Two interlocked chain links. */
export function ChainIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <rect x="2.5" y="9" width="11" height="6" rx="3" />
      <rect x="10.5" y="9" width="11" height="6" rx="3" />
    </Svg>
  );
}

/** Sprocket cone, side profile. */
export function CassetteIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M9.5 5h5" />
      <path d="M7.5 9.5h9" />
      <path d="M5.5 14h13" />
      <path d="M3.5 18.5h17" />
    </Svg>
  );
}

/** Chainring with crank arm and pedal. */
export function ChainringIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <circle cx="10" cy="13" r="7" />
      <circle cx="10" cy="13" r="1" />
      <path d="m10 13 7.5-6" />
      <path d="M15 4.5h5" />
    </Svg>
  );
}

/** Bearing with axle stubs. */
export function BottomBracketIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="6.5" />
      <circle cx="12" cy="12" r="2" />
      <path d="M2 12h3.5" />
      <path d="M18.5 12H22" />
    </Svg>
  );
}

/** Two jockey wheels on the derailleur cage. */
export function PulleyWheelsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <circle cx="8.5" cy="7.5" r="3.5" />
      <circle cx="15.5" cy="16.5" r="3.5" />
      <path d="m11 10 2 4" />
    </Svg>
  );
}

/**
 * Tire as a thick donut — two close concentric circles reading as the casing
 * around the rim. Radiating tread ticks were tried first and read as a gear
 * cog at 14px; the plain donut is unmistakably a tire and stays distinct from
 * the spoked-wheel container and the valved inner tube.
 */
export function TireIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props} strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5.5" />
    </Svg>
  );
}

/** Tube with valve stem. */
export function InnerTubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="13.5" r="7" />
      <path d="M12 2.5v4" />
      <path d="M10.5 3.5h3" />
    </Svg>
  );
}

/** Caliper cross-section: two pads on a rotor edge. */
export function BrakePadsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M12 3v18" />
      <rect x="4.5" y="8" width="3.5" height="8" rx="1.5" />
      <rect x="16" y="8" width="3.5" height="8" rx="1.5" />
    </Svg>
  );
}

/** Disc rotor with its bolt-hole ring. */
export function BrakeRotorIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="2.5" />
      <circle cx="12" cy="6.5" r="0.3" fill="currentColor" />
      <circle cx="17.2" cy="10.3" r="0.3" fill="currentColor" />
      <circle cx="15.2" cy="16.5" r="0.3" fill="currentColor" />
      <circle cx="8.8" cy="16.5" r="0.3" fill="currentColor" />
      <circle cx="6.8" cy="10.3" r="0.3" fill="currentColor" />
    </Svg>
  );
}

/** Cable run ending in a housing ferrule. */
export function CableIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M3 19c5 0 4.5-6 7-9.5C11.8 7 13.5 6 15.5 6" />
      <rect x="15.5" y="3.5" width="5.5" height="5" rx="1.5" />
    </Svg>
  );
}

/** Cleat plate with bolt holes. */
export function CleatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M12 3.5 18.5 17c.5 1-.5 2.2-1.6 2.5a17 17 0 0 1-9.8 0C6 19.2 5 18 5.5 17Z" />
      <circle cx="12" cy="10" r="0.3" fill="currentColor" />
      <circle cx="12" cy="15" r="0.3" fill="currentColor" />
    </Svg>
  );
}

/** Drop bar with wrap ticks. */
export function BarTapeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M3 6h11.5A5.5 5.5 0 0 1 20 11.5v1A5.5 5.5 0 0 1 14.5 18H13" />
      <path d="m5.5 4.2 1.4 3.6" />
      <path d="m8.7 4.2 1.4 3.6" />
      <path d="m11.9 4.2 1.4 3.6" />
    </Svg>
  );
}

/** Spoked wheel — the container icon for front/rear wheel groups. */
export function SpokedWheelIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props} strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="1.4" />
      <path d="M12 3.5v7" />
      <path d="M12 13.5v7" />
      <path d="m4.6 7.75 6.1 3.5" />
      <path d="m13.3 12.75 6.1 3.5" />
      <path d="m19.4 7.75-6.1 3.5" />
      <path d="m10.7 12.75-6.1 3.5" />
    </Svg>
  );
}

/** Chainring, cog and the chain run between them. */
export function DrivetrainIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <circle cx="8" cy="12" r="5.5" />
      <circle cx="18.5" cy="14" r="3" />
      <circle cx="8" cy="12" r="0.3" fill="currentColor" />
      <path d="M8.5 6.5 18 11" />
      <path d="M8.5 17.5 18 17" />
    </Svg>
  );
}
