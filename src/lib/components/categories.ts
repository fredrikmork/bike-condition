export type ComponentCategory = "Drivetrain" | "Wheels" | "Brakes" | "Other";

const CATEGORY_MAP: Record<string, ComponentCategory> = {
  chain: "Drivetrain",
  cassette: "Drivetrain",
  chainrings: "Drivetrain",
  tire_front: "Wheels",
  tire_rear: "Wheels",
  brake_pads_front: "Brakes",
  brake_pads_rear: "Brakes",
  brake_rotors: "Brakes",
  cables: "Other",
  bottom_bracket: "Other",
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
