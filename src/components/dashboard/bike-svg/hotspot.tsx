"use client";

import { type HotspotData, wearFill } from "./types";

interface HotspotProps {
  hotspot: HotspotData;
  isHovered: boolean;
  onHover: (type: string | null) => void;
  onGhostClick: (type: string) => void;
  children: React.ReactNode;
}

export function Hotspot({ hotspot, isHovered, onHover, onGhostClick, children }: HotspotProps) {
  const isMissing = hotspot.wearStatus === "missing";
  const fill        = isHovered ? wearFill(hotspot.wearStatus) : "transparent";
  const fillOpacity = isMissing ? (isHovered ? 0.12 : 0) : isHovered ? 0.28 : 0;
  const stroke      = isMissing ? "#6B7280" : isHovered ? wearFill(hotspot.wearStatus) : "none";
  const strokeDash  = isMissing ? "4 3" : undefined;
  const strokeOp    = isMissing ? (isHovered ? 0.9 : 0.45) : 1;

  return (
    <g
      data-type={hotspot.type}
      style={{ cursor: "pointer" }}
      onMouseEnter={() => onHover(hotspot.type)}
      onMouseLeave={() => onHover(null)}
      onClick={() => { if (isMissing) onGhostClick(hotspot.type); }}
      aria-label={hotspot.label}
    >
      <title>{hotspot.label}{isMissing ? " (not added)" : ""}</title>
      <HotspotOverlay
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeDash={strokeDash}
        strokeOp={strokeOp}
      >
        {children}
      </HotspotOverlay>
    </g>
  );
}

interface OverlayProps {
  fill: string;
  fillOpacity: number;
  stroke: string;
  strokeDash?: string;
  strokeOp: number;
  children: React.ReactNode;
}

function HotspotOverlay({ fill, fillOpacity, stroke, strokeDash, strokeOp, children }: OverlayProps) {
  const nodes = Array.isArray(children) ? children : [children];
  return (
    <>
      {nodes.map((child, i) => {
        if (!child || typeof child !== "object") return child;
        const el = child as React.ReactElement<React.SVGProps<SVGElement>>;
        return (
          <el.type
            key={i}
            {...el.props}
            fill={fill}
            fillOpacity={fillOpacity}
            stroke={stroke}
            strokeWidth={2}
            strokeDasharray={strokeDash}
            strokeOpacity={strokeOp}
            style={{ transition: "fill-opacity 0.15s, stroke-opacity 0.15s" }}
          />
        );
      })}
    </>
  );
}
