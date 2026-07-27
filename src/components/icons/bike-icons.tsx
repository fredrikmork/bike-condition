import type { SVGProps } from "react";

/**
 * Bike silhouettes per bike type (Trello #14): a road bike gets drop bars, an
 * MTB a flat bar and sloping top tube, a TT bike aero extensions and a rear
 * disc, and so on. All share the same wheelbase so switching type reads as
 * the same bike changing shape, not a different icon.
 */

function Svg(props: SVGProps<SVGSVGElement> & { children: React.ReactNode }) {
  const { children, ...rest } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

/** Shared wheels + core frame; the head area differs per type. */
function Wheels() {
  return (
    <>
      <circle cx="5.5" cy="16.5" r="3.8" />
      <circle cx="18.5" cy="16.5" r="3.8" />
    </>
  );
}

export function RoadBikeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <Wheels />
      {/* frame */}
      <path d="M5.5 16.5 9.5 8h6l3 8.5" />
      <path d="M9.5 8 12 16.5h-6.5" />
      {/* saddle */}
      <path d="M8 5.5h3.5L9.5 8" />
      {/* drop bar */}
      <path d="M15.5 8 15 5.5c2-.8 3.5.5 3 2.5-.3 1.2-1.5 1.5-2.5 1" />
    </Svg>
  );
}

export function MtbBikeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <Wheels />
      {/* sloping top tube + frame */}
      <path d="M5.5 16.5 9 9l6.5 1.5 3 6" />
      <path d="M9 9l3 7.5h-6.5" />
      {/* saddle */}
      <path d="M7.5 6.5h3L9 9" />
      {/* flat wide bar */}
      <path d="M15.5 10.5 15 6" />
      <path d="M12.5 5.5h5" />
    </Svg>
  );
}

export function TtBikeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      {/* rear disc wheel */}
      <circle cx="5.5" cy="16.5" r="3.8" />
      <circle cx="5.5" cy="16.5" r="1.6" />
      <circle cx="18.5" cy="16.5" r="3.8" />
      {/* frame */}
      <path d="M5.5 16.5 9.5 8h6l3 8.5" />
      <path d="M9.5 8 12 16.5h-6.5" />
      {/* saddle */}
      <path d="M8 5.5h3L9.5 8" />
      {/* aero extensions */}
      <path d="M15.5 8 15 5.5" />
      <path d="M13.5 5.5h7" />
      <path d="M14.5 3.5h5" />
    </Svg>
  );
}

export function HybridBikeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <Wheels />
      <path d="M5.5 16.5 9.5 8.5h6l3 8" />
      <path d="M9.5 8.5 12 16.5h-6.5" />
      {/* saddle */}
      <path d="M8 6h3l-1.5 2.5" />
      {/* upright bar */}
      <path d="M15.5 8.5 15 4.5" />
      <path d="M13 4.5h4" />
    </Svg>
  );
}

export function EBikeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <Wheels />
      <path d="M5.5 16.5 9.5 8h6l3 8.5" />
      <path d="M9.5 8 12 16.5h-6.5" />
      <path d="M8 5.5h3L9.5 8" />
      <path d="M15.5 8 15 5.5h3" />
      {/* battery bolt in the main triangle */}
      <path d="m11 10-1.2 2.6h1.8L10.4 15" strokeWidth="1.5" />
    </Svg>
  );
}
