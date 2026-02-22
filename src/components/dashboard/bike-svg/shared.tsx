"use client";

import { Hotspot } from "./hotspot";
import type { HotspotData } from "./types";

// ── Colour palette (dark-theme optimised) ────────────────────────────────────
export const FRAME  = "#94A3B8";  // slate-400  — main tubes
export const FRAME2 = "#64748B";  // slate-500  — secondary tubes, fork
export const TYRE   = "#1E293B";  // slate-900  — rubber
export const RIM    = "#475569";  // slate-600  — rim
export const HUB    = "#334155";  // slate-700  — hub shells
export const DRV    = "#7C8FA4";  // drivetrain rings
export const VOID   = "#0F172A";  // axle void

// ── MaybeHotspot ─────────────────────────────────────────────────────────────
export interface ShapeProps {
  hotspots: HotspotData[];
  svgId: string;
  hoveredType: string | null;
  onHotspotHover: (type: string | null) => void;
  onGhostClick: (type: string) => void;
  children: React.ReactNode;
}

export function MaybeHotspot({ hotspots, svgId, hoveredType, onHotspotHover, onGhostClick, children }: ShapeProps) {
  const hotspot = hotspots.find((h) => h.svgId === svgId);
  if (!hotspot) return <>{children}</>;
  return (
    <Hotspot
      hotspot={hotspot}
      isHovered={hoveredType === hotspot.type}
      onHover={onHotspotHover}
      onGhostClick={onGhostClick}
    >
      {children}
    </Hotspot>
  );
}
