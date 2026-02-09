import type { Component } from "@/lib/supabase/types";

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
  const km = meters / 1000;
  if (km >= 1000) {
    return `${(km / 1000).toFixed(1)}k km`;
  }
  return `${Math.round(km).toLocaleString()} km`;
}

