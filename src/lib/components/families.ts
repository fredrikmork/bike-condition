/**
 * A component family pairs front + rear components for visual grouping.
 * Drivetrain components are NOT families — they render individually.
 */
export interface ComponentFamily {
  label: string;
  frontType: string;
  rearType: string;
}

export const COMPONENT_FAMILIES: ComponentFamily[] = [
  { label: "Tires",        frontType: "tire_front",        rearType: "tire_rear"        },
  { label: "Inner Tubes",  frontType: "inner_tube_front",  rearType: "inner_tube_rear"  },
  { label: "Brake Pads",   frontType: "brake_pads_front",  rearType: "brake_pads_rear"  },
  { label: "Brake Rotors", frontType: "brake_rotor_front", rearType: "brake_rotor_rear" },
];

/** Set of all types that belong to a family — used to detect paired rendering */
export const FAMILY_TYPES = new Set(
  COMPONENT_FAMILIES.flatMap((f) => [f.frontType, f.rearType])
);
