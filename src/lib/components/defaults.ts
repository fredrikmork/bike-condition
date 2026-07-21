import type { BikeConfig, BrakeType, ComponentInsert } from "@/lib/supabase/types";

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
  | "shifter_cables"
  | "brake_cables"
  // Contact points
  | "cleats"
  // Legacy (kept for existing data, not generated for new bikes)
  | "bar_tape"
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
  disc: 3_500_000, // 3,500 km — mixed resin/sintered average (resin: 2,500–5,000 km; sintered: 5,000–8,000 km)
  rim: 5_000_000, // 5,000 km — alloy rim, dry conditions (3,000–7,000 km range)
};

// Always-present components regardless of bike config
const UNIVERSAL_COMPONENTS: DefaultComponent[] = [
  { name: "Chain", type: "chain", recommended_distance: 3_000_000 }, // 11/12-speed at 0.5% stretch: 2,500–5,000 km
  { name: "Cassette", type: "cassette", recommended_distance: 15_000_000 }, // 105/Ultegra: 8,000–20,000 km; replace 3× chain lifespan
  { name: "Chainrings", type: "chainrings", recommended_distance: 25_000_000 }, // Aluminium road rings: 15,000–30,000 km
  { name: "Bottom Bracket", type: "bottom_bracket", recommended_distance: 15_000_000 }, // Sealed cartridge: 8,000–25,000 km
  { name: "Pulley Wheels", type: "pulley_wheels", recommended_distance: 15_000_000 }, // OEM plastic: 8,000–20,000 km
  { name: "Front Tire", type: "tire_front", recommended_distance: 10_000_000 }, // GP5000 front: 8,000–14,000 km (BicycleRollingResistance endurance test)
  { name: "Rear Tire", type: "tire_rear", recommended_distance: 6_000_000 }, // GP5000 rear: 4,000–8,000 km
  { name: "Cleats", type: "cleats", recommended_distance: 10_000_000 }, // SPD-SL: 10,000–20,000 km (walking-dependent)
];

/**
 * Builds the full list of default components for a given bike config.
 * Used by both createConfiguredComponents and getAvailableComponentTypes.
 */
function buildConfiguredComponentList(config: BikeConfig): DefaultComponent[] {
  const components: DefaultComponent[] = [...UNIVERSAL_COMPONENTS];

  const padDistance = BRAKE_PAD_DISTANCE[config.brake_type];
  components.push(
    { name: "Brake Pads (Front)", type: "brake_pads_front", recommended_distance: padDistance },
    { name: "Brake Pads (Rear)", type: "brake_pads_rear", recommended_distance: padDistance }
  );

  if (config.brake_type === "disc") {
    components.push(
      { name: "Brake Rotor (Front)", type: "brake_rotor_front", recommended_distance: 25_000_000 }, // 15,000–40,000 km; descending volume is dominant factor
      { name: "Brake Rotor (Rear)", type: "brake_rotor_rear", recommended_distance: 25_000_000 }
    );
    // Hydraulic disc → no brake cables
  }

  if (config.brake_type === "rim") {
    components.push(
      { name: "Brake Cables", type: "brake_cables", recommended_distance: 12_000_000 } // Coated cables: 10,000–20,000 km
    );
    // No rotors for rim brakes
  }

  if (config.shifting_type === "mechanical") {
    components.push(
      { name: "Shifter Cables", type: "shifter_cables", recommended_distance: 10_000_000 } // Coated cables: 8,000–15,000 km
    );
  }
  // Electronic shifting → no cables

  if (config.tire_system !== "tubeless") {
    components.push(
      { name: "Inner Tube (Front)", type: "inner_tube_front", recommended_distance: 5_000_000 }, // Butyl: 3,000–6,000 km; primarily replaced on puncture
      { name: "Inner Tube (Rear)", type: "inner_tube_rear", recommended_distance: 4_000_000 }
    );
  }
  // Tubeless → no inner tubes

  return components;
}

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
  return buildConfiguredComponentList(config).map((c) => ({
    bike_id: bikeId,
    name: c.name,
    type: c.type,
    recommended_distance: c.recommended_distance,
    current_distance: bikeDistance,
    bike_distance_at_install: 0,
  }));
}

/**
 * Returns the component types available to add for a given bike config,
 * excluding types that are already installed.
 */
export function getAvailableComponentTypes(
  config: BikeConfig | null,
  existingComponents: { type: string }[]
): DefaultComponent[] {
  if (!config) return [];
  const existingTypes = new Set(existingComponents.map((c) => c.type));
  return buildConfiguredComponentList(config).filter((c) => !existingTypes.has(c.type));
}

/**
 * Legacy default list — used for unconfigured bikes only.
 * Kept for backwards compatibility with existing data.
 */
export const DEFAULT_COMPONENTS: DefaultComponent[] = [
  { name: "Chain", type: "chain", recommended_distance: 3_000_000 },
  { name: "Cassette", type: "cassette", recommended_distance: 15_000_000 },
  { name: "Front Tire", type: "tire_front", recommended_distance: 10_000_000 },
  { name: "Rear Tire", type: "tire_rear", recommended_distance: 6_000_000 },
  { name: "Brake Pads (Front)", type: "brake_pads_front", recommended_distance: 3_500_000 },
  { name: "Brake Pads (Rear)", type: "brake_pads_rear", recommended_distance: 3_500_000 },
  { name: "Bottom Bracket", type: "bottom_bracket", recommended_distance: 15_000_000 },
  { name: "Chainring(s)", type: "chainrings", recommended_distance: 25_000_000 },
];

/** Legacy factory — used only for unconfigured bikes during sync */
export function createDefaultComponents(bikeId: string, bikeDistance: number): ComponentInsert[] {
  return DEFAULT_COMPONENTS.map((component) => ({
    bike_id: bikeId,
    name: component.name,
    type: component.type,
    recommended_distance: component.recommended_distance,
    current_distance: bikeDistance,
    bike_distance_at_install: 0,
  }));
}
