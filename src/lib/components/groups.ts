export interface ComponentGroupDef {
  id: "front_wheel" | "rear_wheel" | "drivetrain";
  label: string;
  /** Ordered list — only types with an installed component are shown */
  types: string[];
  canBatchReplace: boolean;
}

export const COMPONENT_GROUPS: ComponentGroupDef[] = [
  {
    id: "front_wheel",
    label: "Front Wheel",
    types: ["tire_front", "inner_tube_front", "brake_pads_front", "brake_rotor_front"],
    canBatchReplace: true,
  },
  {
    id: "rear_wheel",
    label: "Rear Wheel",
    types: ["tire_rear", "inner_tube_rear", "brake_pads_rear", "brake_rotor_rear"],
    canBatchReplace: true,
  },
  {
    id: "drivetrain",
    label: "Drivetrain",
    types: ["chain", "cassette", "chainrings", "bottom_bracket", "pulley_wheels", "shift_cables"],
    canBatchReplace: false,
  },
];

/** All component types claimed by a group — used to compute ungrouped leftovers */
export const GROUPED_TYPES = new Set(COMPONENT_GROUPS.flatMap((g) => g.types));

/** Component types that are physically on the wheels (excluded during virtual rides when paused) */
export const WHEEL_TYPES = new Set(
  COMPONENT_GROUPS
    .filter((g) => g.id === "front_wheel" || g.id === "rear_wheel")
    .flatMap((g) => g.types)
);
