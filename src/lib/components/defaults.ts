import type { ComponentInsert } from "@/lib/supabase/types";

export type ComponentType =
  | "chain"
  | "cassette"
  | "tire_front"
  | "tire_rear"
  | "brake_pads"
  | "bar_tape"
  | "cables"
  | "bottom_bracket"
  | "headset";

export interface DefaultComponent {
  name: string;
  type: ComponentType;
  recommended_distance: number; // in meters
}

// Default components with recommended replacement distances
export const DEFAULT_COMPONENTS: DefaultComponent[] = [
  {
    name: "Chain",
    type: "chain",
    recommended_distance: 3_000_000, // 3,000 km
  },
  {
    name: "Cassette",
    type: "cassette",
    recommended_distance: 10_000_000, // 10,000 km
  },
  {
    name: "Front Tire",
    type: "tire_front",
    recommended_distance: 5_000_000, // 5,000 km
  },
  {
    name: "Rear Tire",
    type: "tire_rear",
    recommended_distance: 4_000_000, // 4,000 km
  },
  {
    name: "Brake Pads",
    type: "brake_pads",
    recommended_distance: 2_000_000, // 2,000 km
  },
  {
    name: "Bar Tape",
    type: "bar_tape",
    recommended_distance: 5_000_000, // 5,000 km
  },
];

export function createDefaultComponents(
  bikeId: string,
  initialDistance = 0
): ComponentInsert[] {
  return DEFAULT_COMPONENTS.map((component) => ({
    bike_id: bikeId,
    name: component.name,
    type: component.type,
    recommended_distance: component.recommended_distance,
    current_distance: initialDistance,
  }));
}

