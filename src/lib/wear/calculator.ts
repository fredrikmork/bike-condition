import type { Component, LubeType } from "@/lib/supabase/types";

export type WearStatus = "healthy" | "warning" | "critical";

export interface WearInfo {
  percentage: number;
  status: WearStatus;
  remainingDistance: number; // in meters
  isOverdue: boolean;
}

export function calculateWear(
  currentDistance: number,
  recommendedDistance: number
): WearInfo {
  const percentage = (currentDistance / recommendedDistance) * 100;
  const remainingDistance = Math.max(0, recommendedDistance - currentDistance);
  const isOverdue = currentDistance >= recommendedDistance;

  let status: WearStatus;
  if (percentage >= 100) {
    status = "critical";
  } else if (percentage >= 80) {
    status = "warning";
  } else {
    status = "healthy";
  }

  return {
    percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal
    status,
    remainingDistance,
    isOverdue,
  };
}

export function calculateComponentWear(component: Component): WearInfo {
  return calculateWear(component.current_distance, component.recommended_distance);
}

// Format distance for display
export function formatDistance(meters: number): string {
  const km = Math.round(meters / 1000);
  return `${km.toLocaleString("nb-NO")} km`;
}

// Lube type multipliers — only meaningful for chain components.
// Applied to a base recommended distance to get a suggested replacement interval.
const LUBE_MULTIPLIERS: Record<LubeType, number> = {
  wet_lube:  0.8,  // attracts grit, fastest wear
  dry_lube:  1.0,  // reference baseline
  drip_wax:  1.3,  // cleaner, slower wear
  hot_wax:   1.6,  // cleanest, longest chain life
};

export const LUBE_LABELS: Record<LubeType, string> = {
  wet_lube: "Wet lube",
  dry_lube: "Dry lube",
  drip_wax: "Drip-on wax",
  hot_wax:  "Hot wax",
};

// Base chain replacement distance (meters) when lube type is dry lube (reference).
const CHAIN_BASE_DISTANCE_M = 3_000_000; // 3 000 km

/**
 * Returns the suggested replacement distance (in meters) for a chain given a lube type.
 * For non-chain components, lube type is informational — return null.
 */
export function getSuggestedDistance(
  componentType: string,
  lubeType: LubeType | null
): number | null {
  if (componentType !== "chain" || !lubeType) return null;
  return Math.round(CHAIN_BASE_DISTANCE_M * LUBE_MULTIPLIERS[lubeType]);
}

