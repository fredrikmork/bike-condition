import type { WearStatus } from "@/lib/wear/calculator";

export interface HotspotData {
  type: string;
  svgId: string;
  label: string;
  wearStatus: WearStatus | "missing";
  wearPercentage: number;
}

export interface BikeSchematicProps {
  hotspots: HotspotData[];
  hoveredType: string | null;
  onHotspotHover: (type: string | null) => void;
  onGhostClick: (type: string) => void;
}

export function wearFill(status: WearStatus | "missing"): string {
  switch (status) {
    case "healthy":  return "var(--color-status-healthy)";
    case "warning":  return "var(--color-status-warning)";
    case "critical": return "var(--color-status-critical)";
    case "missing":  return "transparent";
  }
}
