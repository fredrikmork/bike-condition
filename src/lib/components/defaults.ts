import type { ComponentInsert } from "@/lib/supabase/types";

export type ComponentType =
  | "chain"
  | "cassette"
  | "tire_front"
  | "tire_rear"
  | "brake_pads_front"
  | "brake_pads_rear"
  | "brake_rotors"
  | "cables"
  | "bottom_bracket"
  | "chainrings"
  | "custom";

export interface DefaultComponent {
  name: string;
  type: ComponentType;
  recommended_distance: number; // in meters
}

// Default components with recommended replacement distances (mechanic perspective, disc brakes)
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
    name: "Brake Pads (Front)",
    type: "brake_pads_front",
    recommended_distance: 1_500_000, // 1,500 km
  },
  {
    name: "Brake Pads (Rear)",
    type: "brake_pads_rear",
    recommended_distance: 1_500_000, // 1,500 km
  },
  {
    name: "Brake Rotors",
    type: "brake_rotors",
    recommended_distance: 15_000_000, // 15,000 km
  },
  {
    name: "Cables & Housing",
    type: "cables",
    recommended_distance: 5_000_000, // 5,000 km
  },
  {
    name: "Bottom Bracket",
    type: "bottom_bracket",
    recommended_distance: 10_000_000, // 10,000 km
  },
  {
    name: "Chainring(s)",
    type: "chainrings",
    recommended_distance: 15_000_000, // 15,000 km
  },
];

export function createDefaultComponents(
  bikeId: string,
  bikeDistance: number
): ComponentInsert[] {
  return DEFAULT_COMPONENTS.map((component) => ({
    bike_id: bikeId,
    name: component.name,
    type: component.type,
    recommended_distance: component.recommended_distance,
    current_distance: bikeDistance,
    bike_distance_at_install: 0, // assumed on since beginning
  }));
}
