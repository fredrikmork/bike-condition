import type { BikeType } from "./types";
import type { BikeConfig } from "@/lib/supabase/types";

export type ComponentCategory =
  | 'drivetrain'
  | 'wheels'
  | 'brakes'
  | 'cables'
  | 'custom';

export interface ComponentSpec {
  type: string;
  label: string;
  svgId: string;
  category: ComponentCategory;
  required: boolean;
  bikeTypes: BikeType[];
  defaultRecommendedDistance: number; // meters
  unique: boolean;
}

const ALL: BikeType[] = ['road', 'mtb', 'tt', 'hybrid', 'ebike'];
const NO_TT: BikeType[] = ['road', 'mtb', 'hybrid', 'ebike'];
const TUBED: BikeType[] = ['road', 'mtb', 'hybrid', 'ebike'];
const CABLED: BikeType[] = ['road', 'mtb', 'hybrid', 'ebike'];

export const COMPONENT_REGISTRY: ComponentSpec[] = [
  {
    type: 'chain',
    label: 'Chain',
    svgId: 'chain',
    category: 'drivetrain',
    required: true,
    bikeTypes: ALL,
    defaultRecommendedDistance: 3_000_000,
    unique: true,
  },
  {
    type: 'cassette',
    label: 'Cassette',
    svgId: 'cassette',
    category: 'drivetrain',
    required: true,
    bikeTypes: ALL,
    defaultRecommendedDistance: 15_000_000,
    unique: true,
  },
  {
    type: 'chainrings',
    label: 'Chainrings',
    svgId: 'chainrings',
    category: 'drivetrain',
    required: true,
    bikeTypes: ALL,
    defaultRecommendedDistance: 15_000_000,
    unique: true,
  },
  {
    type: 'bottom_bracket',
    label: 'Bottom Bracket',
    svgId: 'bottom_bracket',
    category: 'drivetrain',
    required: true,
    bikeTypes: ALL,
    defaultRecommendedDistance: 15_000_000,
    unique: true,
  },
  {
    type: 'pulley_wheels',
    label: 'Pulley Wheels',
    svgId: 'pulley_wheels',
    category: 'drivetrain',
    required: true,
    bikeTypes: ALL,
    defaultRecommendedDistance: 15_000_000,
    unique: true,
  },
  {
    type: 'tire_front',
    label: 'Front Tire',
    svgId: 'tire_front',
    category: 'wheels',
    required: true,
    bikeTypes: ALL,
    defaultRecommendedDistance: 5_000_000,
    unique: true,
  },
  {
    type: 'tire_rear',
    label: 'Rear Tire',
    svgId: 'tire_rear',
    category: 'wheels',
    required: true,
    bikeTypes: ALL,
    defaultRecommendedDistance: 5_000_000,
    unique: true,
  },
  {
    type: 'inner_tube_front',
    label: 'Front Inner Tube',
    svgId: 'inner_tube_front',
    category: 'wheels',
    required: true,
    bikeTypes: TUBED,
    defaultRecommendedDistance: 5_000_000,
    unique: true,
  },
  {
    type: 'inner_tube_rear',
    label: 'Rear Inner Tube',
    svgId: 'inner_tube_rear',
    category: 'wheels',
    required: true,
    bikeTypes: TUBED,
    defaultRecommendedDistance: 5_000_000,
    unique: true,
  },
  {
    type: 'brake_pads_front',
    label: 'Front Brake Pads',
    svgId: 'brake_pads_front',
    category: 'brakes',
    required: true,
    bikeTypes: ALL,
    defaultRecommendedDistance: 3_000_000,
    unique: true,
  },
  {
    type: 'brake_pads_rear',
    label: 'Rear Brake Pads',
    svgId: 'brake_pads_rear',
    category: 'brakes',
    required: true,
    bikeTypes: ALL,
    defaultRecommendedDistance: 3_000_000,
    unique: true,
  },
  {
    type: 'brake_rotor_front',
    label: 'Front Brake Rotor',
    svgId: 'brake_rotor_front',
    category: 'brakes',
    required: true,
    bikeTypes: ALL,
    defaultRecommendedDistance: 20_000_000,
    unique: true,
  },
  {
    type: 'brake_rotor_rear',
    label: 'Rear Brake Rotor',
    svgId: 'brake_rotor_rear',
    category: 'brakes',
    required: true,
    bikeTypes: ALL,
    defaultRecommendedDistance: 20_000_000,
    unique: true,
  },
  {
    type: 'shift_cables',
    label: 'Shift Cables',
    svgId: 'shift_cables',
    category: 'cables',
    required: true,
    bikeTypes: CABLED,
    defaultRecommendedDistance: 5_000_000,
    unique: true,
  },
  {
    type: 'brake_cables',
    label: 'Brake Cables',
    svgId: 'brake_cables',
    category: 'cables',
    required: true,
    bikeTypes: CABLED,
    defaultRecommendedDistance: 5_000_000,
    unique: true,
  },
  {
    type: 'custom',
    label: 'Custom Component',
    svgId: '',
    category: 'custom',
    required: false,
    bikeTypes: ALL,
    defaultRecommendedDistance: 5_000_000,
    unique: false,
  },
];

/**
 * Returns the valid component specs for a given bike type and config.
 * Applies visibility rules (disc/rim brakes, tubeless, electronic shifting).
 */
export function getRegistryForBike(
  bikeType: BikeType,
  config: BikeConfig | null
): ComponentSpec[] {
  return COMPONENT_REGISTRY.filter((spec) => {
    // Custom is always available but not shown as a registry type
    if (spec.type === 'custom') return false;

    // Must support this bike type
    if (!spec.bikeTypes.includes(bikeType)) return false;

    // Apply config-based visibility rules (same logic as visibility.ts)
    if (config) {
      // Electronic shifting → no cables
      if (config.shifting_type === 'electronic' && spec.type === 'shift_cables') return false;

      // Disc brakes → no brake cables
      if (config.brake_type === 'disc' && spec.type === 'brake_cables') return false;

      // Rim brakes → no rotors
      if (config.brake_type === 'rim') {
        if (spec.type === 'brake_rotor_front' || spec.type === 'brake_rotor_rear') return false;
      }

      // Tubeless → no inner tubes
      if (config.tire_system === 'tubeless') {
        if (spec.type === 'inner_tube_front' || spec.type === 'inner_tube_rear') return false;
      }
    }

    return true;
  });
}

/** Look up a single spec by component type */
export function getSpecByType(type: string): ComponentSpec | undefined {
  return COMPONENT_REGISTRY.find((s) => s.type === type);
}
