"use client";

import type { BikeSchematicProps } from "./types";
import { MaybeHotspot, FRAME, FRAME2, TYRE, RIM, HUB, DRV, VOID } from "./shared";

// ── Road bike schematic — viewBox 0 0 480 280 ───────────────────────────────
//
// Key coordinates (measured from top-left, y increases downward):
//
//   RW  = rear axle     (88, 200)
//   FW  = front axle    (370, 200)
//   BB  = bottom bracket(200, 200)   ← sits at axle height
//   ST  = seatpost top  (172, 96)
//   HT1 = head tube top (345, 118)
//   HT2 = head tube bot (358, 152)
//
// Frame angles (approximate road bike geometry):
//   Seat tube:  ~73° from horizontal  → rise 104, run -28
//   Head tube:  ~72° from horizontal  → length 36, rise 34, run 13
//   Top tube:   slight downward slope ST→HT1
//   Down tube:  steep diagonal BB→HT2

const RW  = { cx: 88,  cy: 200 } as const;
const FW  = { cx: 370, cy: 200 } as const;
const BB  = { cx: 200, cy: 200 } as const;
const ST  = { x: 172,  y: 96  } as const;   // seatpost top (inside frame)
const SP  = { x: 170,  y: 76  } as const;   // visible seatpost tip (above ST)
const HT1 = { x: 345,  y: 118 } as const;   // head tube top
const HT2 = { x: 358,  y: 152 } as const;   // head tube bottom / fork crown

const WHEEL_R  = 74;
const TYRE_W   = 8;
const RIM_R    = WHEEL_R - TYRE_W - 1;  // 65
const ROTOR_R  = 18;
const SPOKE_N  = 18;

// ── Wheel ─────────────────────────────────────────────────────────────────────
function Wheel({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      {/* Tyre */}
      <circle cx={cx} cy={cy} r={WHEEL_R} fill="none" stroke={TYRE} strokeWidth={TYRE_W} />
      {/* Rim sidewall highlight */}
      <circle cx={cx} cy={cy} r={RIM_R + 1} fill="none" stroke={RIM} strokeWidth={1} opacity={0.5} />
      {/* Rim bed */}
      <circle cx={cx} cy={cy} r={RIM_R} fill="none" stroke={RIM} strokeWidth={3.5} />
      {/* Spokes */}
      {Array.from({ length: SPOKE_N }, (_, i) => {
        const a = (i * Math.PI * 2) / SPOKE_N;
        return (
          <line
            key={i}
            x1={cx + 12 * Math.cos(a)} y1={cy + 12 * Math.sin(a)}
            x2={cx + (RIM_R - 2) * Math.cos(a)} y2={cy + (RIM_R - 2) * Math.sin(a)}
            stroke={FRAME2} strokeWidth={0.7} opacity={0.5}
          />
        );
      })}
      {/* Hub shell */}
      <circle cx={cx} cy={cy} r={12} fill={HUB} stroke={FRAME2} strokeWidth={2} />
      {/* Axle void */}
      <circle cx={cx} cy={cy} r={4.5} fill={VOID} />
    </g>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function RoadBikeSvg({ hotspots, hoveredType, onHotspotHover, onGhostClick }: BikeSchematicProps) {
  const h = { hotspots, hoveredType, onHotspotHover, onGhostClick };

  return (
    <svg
      viewBox="0 0 480 280"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Road bike schematic"
      role="img"
      className="w-full h-full"
    >
      <title>Road bike component diagram</title>

      {/* ══════════════════════════════════════════════════════════════════════
          VISUAL LAYER  (drawn first, underneath interactive hotspot overlays)
          ══════════════════════════════════════════════════════════════════════ */}

      {/* ── Wheels ─────────────────────────────────────────────────────────── */}
      <Wheel cx={RW.cx} cy={RW.cy} />
      <Wheel cx={FW.cx} cy={FW.cy} />

      {/* ── Disc rotor outlines ─────────────────────────────────────────────── */}
      <circle cx={RW.cx} cy={RW.cy} r={ROTOR_R} fill="none" stroke={FRAME2} strokeWidth={1.5} opacity={0.3} />
      <circle cx={FW.cx} cy={FW.cy} r={ROTOR_R} fill="none" stroke={FRAME2} strokeWidth={1.5} opacity={0.3} />

      {/* ── Frame ──────────────────────────────────────────────────────────── */}

      {/* Chain stay: BB → RW (with slight vertical offset for realism) */}
      <line
        x1={BB.cx} y1={BB.cy}
        x2={RW.cx + 12} y2={RW.cy}
        stroke={FRAME} strokeWidth={4} strokeLinecap="round"
      />

      {/* Seat stay: RW → ST (rear triangle top) */}
      <line
        x1={RW.cx + 12} y1={RW.cy}
        x2={ST.x} y2={ST.y + 6}
        stroke={FRAME} strokeWidth={3} strokeLinecap="round"
      />

      {/* Seat tube: BB → ST */}
      <line
        x1={BB.cx} y1={BB.cy}
        x2={ST.x} y2={ST.y + 6}
        stroke={FRAME} strokeWidth={4} strokeLinecap="round"
      />

      {/* Top tube: ST → HT1 (gentle downward slope) */}
      <line
        x1={ST.x + 2} y1={ST.y + 4}
        x2={HT1.x} y2={HT1.y}
        stroke={FRAME} strokeWidth={4} strokeLinecap="round"
      />

      {/* Down tube: BB → HT2 */}
      <line
        x1={BB.cx} y1={BB.cy}
        x2={HT2.x} y2={HT2.y}
        stroke={FRAME} strokeWidth={4} strokeLinecap="round"
      />

      {/* Head tube */}
      <line
        x1={HT1.x} y1={HT1.y}
        x2={HT2.x} y2={HT2.y}
        stroke={FRAME} strokeWidth={6} strokeLinecap="round"
      />

      {/* Fork: HT2 → FW axle */}
      <line
        x1={HT2.x} y1={HT2.y}
        x2={FW.cx - 12} y2={FW.cy}
        stroke={FRAME2} strokeWidth={3} strokeLinecap="round"
      />

      {/* ── Seatpost & Saddle ─────────────────────────────────────────────── */}

      {/* Seatpost shaft above the frame junction */}
      <line
        x1={ST.x} y1={ST.y + 6}
        x2={SP.x} y2={SP.y + 4}
        stroke={FRAME2} strokeWidth={3} strokeLinecap="round"
      />

      {/* Saddle — ergonomic curve */}
      <path
        d={`M ${SP.x - 26},${SP.y + 2} C ${SP.x - 16},${SP.y - 8} ${SP.x},${SP.y - 10} ${SP.x + 18},${SP.y - 4} L ${SP.x + 22},${SP.y}`}
        fill="none" stroke={FRAME} strokeWidth={4} strokeLinecap="round"
      />

      {/* ── Drop handlebars ──────────────────────────────────────────────── */}

      {/* Stem: from HT1 forward-upward */}
      <line
        x1={HT1.x} y1={HT1.y}
        x2={HT1.x + 22} y2={HT1.y - 10}
        stroke={FRAME2} strokeWidth={3} strokeLinecap="round"
      />

      {/* Bar clamp / top section */}
      <line
        x1={HT1.x + 14} y1={HT1.y - 11}
        x2={HT1.x + 36} y2={HT1.y - 11}
        stroke={FRAME} strokeWidth={3} strokeLinecap="round"
      />

      {/* Left hood / drop (toward rider) */}
      <path
        d={`M ${HT1.x + 14},${HT1.y - 11}
            C ${HT1.x + 8},${HT1.y - 11}
              ${HT1.x + 4},${HT1.y + 2}
              ${HT1.x + 7},${HT1.y + 16}`}
        fill="none" stroke={FRAME} strokeWidth={3} strokeLinecap="round"
      />

      {/* Right hood / drop (forward) */}
      <path
        d={`M ${HT1.x + 36},${HT1.y - 11}
            C ${HT1.x + 42},${HT1.y - 11}
              ${HT1.x + 46},${HT1.y + 2}
              ${HT1.x + 43},${HT1.y + 16}`}
        fill="none" stroke={FRAME} strokeWidth={3} strokeLinecap="round"
      />

      {/* ── Drivetrain ───────────────────────────────────────────────────── */}

      {/* Chainring outer */}
      <circle cx={BB.cx} cy={BB.cy} r={22} fill="none" stroke={DRV} strokeWidth={3} opacity={0.9} />
      {/* Chainring inner */}
      <circle cx={BB.cx} cy={BB.cy} r={14} fill="none" stroke={DRV} strokeWidth={2} opacity={0.5} />
      {/* BB shell */}
      <circle cx={BB.cx} cy={BB.cy} r={6} fill={HUB} stroke={FRAME2} strokeWidth={2} />
      <circle cx={BB.cx} cy={BB.cy} r={2.5} fill={VOID} />

      {/* Crank arm */}
      <line
        x1={BB.cx} y1={BB.cy}
        x2={BB.cx + 5} y2={BB.cy + 22}
        stroke={FRAME2} strokeWidth={3} strokeLinecap="round"
      />
      {/* Pedal */}
      <rect
        x={BB.cx + 2} y={BB.cy + 21} width={14} height={4} rx={1.5}
        fill={FRAME2} opacity={0.7}
      />

      {/* Cassette (stacked rings) */}
      <circle cx={RW.cx} cy={RW.cy} r={14} fill="none" stroke={DRV} strokeWidth={2.5} opacity={0.85} />
      <circle cx={RW.cx} cy={RW.cy} r={11} fill="none" stroke={DRV} strokeWidth={2}   opacity={0.65} />
      <circle cx={RW.cx} cy={RW.cy} r={8}  fill="none" stroke={DRV} strokeWidth={1.5} opacity={0.45} />

      {/* Chain — upper run */}
      <line
        x1={BB.cx - 4} y1={BB.cy - 22}
        x2={RW.cx + 4} y2={RW.cy - 14}
        stroke={FRAME2} strokeWidth={1.2} opacity={0.5}
      />
      {/* Chain — lower run */}
      <line
        x1={BB.cx + 4} y1={BB.cy + 20}
        x2={RW.cx + 4} y2={RW.cy + 14}
        stroke={FRAME2} strokeWidth={1.2} opacity={0.35}
      />

      {/* Rear derailleur pulley wheels */}
      <circle cx={RW.cx + 18} cy={RW.cy + 16} r={4} fill="none" stroke={FRAME2} strokeWidth={1.2} opacity={0.55} />
      <circle cx={RW.cx + 24} cy={RW.cy + 24} r={4} fill="none" stroke={FRAME2} strokeWidth={1.2} opacity={0.55} />

      {/* ══════════════════════════════════════════════════════════════════════
          INTERACTIVE HOTSPOT OVERLAY LAYER
          Shapes here are transparent hit areas — Hotspot injects fill/stroke.
          ══════════════════════════════════════════════════════════════════════ */}

      {/* ── Rear wheel ─────────────────────────────────────────────────────── */}
      <MaybeHotspot svgId="tire_rear" {...h}>
        <circle cx={RW.cx} cy={RW.cy} r={WHEEL_R} />
      </MaybeHotspot>

      <MaybeHotspot svgId="inner_tube_rear" {...h}>
        <circle cx={RW.cx} cy={RW.cy} r={WHEEL_R - TYRE_W} />
      </MaybeHotspot>

      <MaybeHotspot svgId="brake_rotor_rear" {...h}>
        <circle cx={RW.cx} cy={RW.cy} r={ROTOR_R} />
      </MaybeHotspot>

      <MaybeHotspot svgId="brake_pads_rear" {...h}>
        <rect x={RW.cx - WHEEL_R - 10} y={RW.cy - 10} width={12} height={20} rx={3} />
      </MaybeHotspot>

      {/* ── Drivetrain ─────────────────────────────────────────────────────── */}
      <MaybeHotspot svgId="cassette" {...h}>
        <circle cx={RW.cx} cy={RW.cy} r={14} />
      </MaybeHotspot>

      <MaybeHotspot svgId="chain" {...h}>
        {/* Wide transparent band covering both chain runs */}
        <rect x={RW.cx + 4} y={RW.cy - 24} width={BB.cx - RW.cx - 8} height={48} rx={8} />
      </MaybeHotspot>

      <MaybeHotspot svgId="pulley_wheels" {...h}>
        <rect x={RW.cx + 12} y={RW.cy + 10} width={20} height={20} rx={5} />
      </MaybeHotspot>

      <MaybeHotspot svgId="chainrings" {...h}>
        <circle cx={BB.cx} cy={BB.cy} r={22} />
      </MaybeHotspot>

      <MaybeHotspot svgId="bottom_bracket" {...h}>
        <circle cx={BB.cx} cy={BB.cy} r={8} />
      </MaybeHotspot>

      {/* ── Front wheel ─────────────────────────────────────────────────────── */}
      <MaybeHotspot svgId="tire_front" {...h}>
        <circle cx={FW.cx} cy={FW.cy} r={WHEEL_R} />
      </MaybeHotspot>

      <MaybeHotspot svgId="inner_tube_front" {...h}>
        <circle cx={FW.cx} cy={FW.cy} r={WHEEL_R - TYRE_W} />
      </MaybeHotspot>

      <MaybeHotspot svgId="brake_rotor_front" {...h}>
        <circle cx={FW.cx} cy={FW.cy} r={ROTOR_R} />
      </MaybeHotspot>

      <MaybeHotspot svgId="brake_pads_front" {...h}>
        <rect x={FW.cx + WHEEL_R - 2} y={FW.cy - 10} width={12} height={20} rx={3} />
      </MaybeHotspot>

      {/* ── Cables (run along the frame — wide invisible hit zones) ─────────── */}
      <MaybeHotspot svgId="shift_cables" {...h}>
        <path
          d={`M ${HT1.x + 14},${HT1.y + 4} Q ${BB.cx + 38},${BB.cy - 34} ${ST.x},${ST.y + 14}`}
          fill="none" strokeWidth={10}
        />
      </MaybeHotspot>

      <MaybeHotspot svgId="brake_cables" {...h}>
        <path
          d={`M ${HT1.x + 18},${HT1.y + 8} Q ${BB.cx + 44},${BB.cy - 24} ${ST.x},${ST.y + 20}`}
          fill="none" strokeWidth={10}
        />
      </MaybeHotspot>
    </svg>
  );
}
