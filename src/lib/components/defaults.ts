import type { ComponentInsert, BikeConfig, BrakeType } from "@/lib/supabase/types";

export type ComponentType =
  // Drivetrain
  | "chain"
  | "cassette"
  | "chainrings"
  | "bottom_bracket"
  | "pulley_wheels"
  // Wheels
  | "tire_front"
  | "tire_rear"
  | "inner_tube_front"
  | "inner_tube_rear"
  // Brakes
  | "brake_pads_front"
  | "brake_pads_rear"
  | "brake_rotor_front"
  | "brake_rotor_rear"
  // Cables
  | "shift_cables"
  | "brake_cables"
  // Legacy (kept for existing data, not generated for new bikes)
  | "brake_rotors"
  | "cables"
  // Custom
  | "custom";

export interface DefaultComponent {
  name: string;
  type: ComponentType;
  recommended_distance: number; // in meters
}

// Brake pad distances differ by brake type
const BRAKE_PAD_DISTANCE: Record<BrakeType, number> = {
  disc: 1_500_000,  // 1,500 km — disc pads (sintered/resin)
  rim:  3_000_000,  // 3,000 km — rim pads (alloy rim; varies widely)
};

// Always-present components regardless of bike config
const UNIVERSAL_COMPONENTS: DefaultComponent[] = [
  { name: "Chain",          type: "chain",          recommended_distance: 3_000_000  },
  { name: "Cassette",       type: "cassette",        recommended_distance: 10_000_000 },
  { name: "Chainring(s)",   type: "chainrings",      recommended_distance: 15_000_000 },
  { name: "Bottom Bracket", type: "bottom_bracket",  recommended_distance: 10_000_000 },
  { name: "Pulley Wheels",  type: "pulley_wheels",   recommended_distance: 20_000_000 },
  { name: "Front Tire",     type: "tire_front",      recommended_distance: 5_000_000  },
  { name: "Rear Tire",      type: "tire_rear",       recommended_distance: 4_000_000  },
];

/**
 * Generate the correct default component list for a configured bike.
 * Called when a user completes bike setup or when a new bike is created
 * after configuration is saved.
 */
export function createConfiguredComponents(
  bikeId: string,
  bikeDistance: number,
  config: BikeConfig
): ComponentInsert[] {
  const components: DefaultComponent[] = [...UNIVERSAL_COMPONENTS];

  const padDistance = BRAKE_PAD_DISTANCE[config.brake_type];
  components.push(
    { name: "Brake Pads (Front)", type: "brake_pads_front", recommended_distance: padDistance },
    { name: "Brake Pads (Rear)",  type: "brake_pads_rear",  recommended_distance: padDistance }
  );

  if (config.brake_type === "disc") {
    components.push(
      { name: "Brake Rotor (Front)", type: "brake_rotor_front", recommended_distance: 20_000_000 },
      { name: "Brake Rotor (Rear)",  type: "brake_rotor_rear",  recommended_distance: 20_000_000 }
    );
    // Hydraulic disc → no brake cables
  }

  if (config.brake_type === "rim") {
    components.push(
      { name: "Brake Cables & Housing", type: "brake_cables", recommended_distance: 5_000_000 }
    );
    // No rotors for rim brakes
  }

  if (config.shifting_type === "mechanical") {
    components.push(
      { name: "Shift Cables & Housing", type: "shift_cables", recommended_distance: 5_000_000 }
    );
  }
  // Electronic shifting → no cables

  if (config.tire_system !== "tubeless") {
    components.push(
      { name: "Inner Tube (Front)", type: "inner_tube_front", recommended_distance: 3_000_000 },
      { name: "Inner Tube (Rear)",  type: "inner_tube_rear",  recommended_distance: 2_000_000 }
    );
  }
  // Tubeless → no inner tubes

  return components.map((c) => ({
    bike_id: bikeId,
    name: c.name,
    type: c.type,
    recommended_distance: c.recommended_distance,
    current_distance: bikeDistance,
    bike_distance_at_install: 0,
  }));
}

/**
 * Legacy default list — used for unconfigured bikes only.
 * Kept for backwards compatibility with existing data.
 */
export const DEFAULT_COMPONENTS: DefaultComponent[] = [
  { name: "Chain",                type: "chain",             recommended_distance: 3_000_000  },
  { name: "Cassette",             type: "cassette",          recommended_distance: 10_000_000 },
  { name: "Front Tire",           type: "tire_front",        recommended_distance: 5_000_000  },
  { name: "Rear Tire",            type: "tire_rear",         recommended_distance: 4_000_000  },
  { name: "Brake Pads (Front)",   type: "brake_pads_front",  recommended_distance: 1_500_000  },
  { name: "Brake Pads (Rear)",    type: "brake_pads_rear",   recommended_distance: 1_500_000  },
  { name: "Brake Rotors",         type: "brake_rotors",      recommended_distance: 15_000_000 },
  { name: "Cables & Housing",     type: "cables",            recommended_distance: 5_000_000  },
  { name: "Bottom Bracket",       type: "bottom_bracket",    recommended_distance: 10_000_000 },
  { name: "Chainring(s)",         type: "chainrings",        recommended_distance: 15_000_000 },
];

/** Legacy factory — used only for unconfigured bikes during sync */
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
    bike_distance_at_install: 0,
  }));
}
