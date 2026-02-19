export type ComponentCategory = "Drivetrain" | "Wheels" | "Brakes" | "Other";

const CATEGORY_MAP: Record<string, ComponentCategory> = {
  // Drivetrain
  chain:          "Drivetrain",
  cassette:       "Drivetrain",
  chainrings:     "Drivetrain",
  bottom_bracket: "Drivetrain",
  pulley_wheels:  "Drivetrain",
  // Wheels
  tire_front:       "Wheels",
  tire_rear:        "Wheels",
  inner_tube_front: "Wheels",
  inner_tube_rear:  "Wheels",
  // Brakes
  brake_pads_front:  "Brakes",
  brake_pads_rear:   "Brakes",
  brake_rotor_front: "Brakes",
  brake_rotor_rear:  "Brakes",
  // Legacy
  brake_rotors: "Brakes",
  // Other / cables
  shift_cables: "Other",
  brake_cables: "Other",
  cables:       "Other",
};

export const CATEGORY_ORDER: ComponentCategory[] = [
  "Drivetrain",
  "Wheels",
  "Brakes",
  "Other",
];

export function getComponentCategory(type: string): ComponentCategory {
  return CATEGORY_MAP[type] ?? "Other";
}
