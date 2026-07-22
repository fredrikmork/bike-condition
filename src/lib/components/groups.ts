export interface ComponentGroupDef {
  id: "front_wheel" | "rear_wheel" | "drivetrain" | "frame";
  label: string;
  /** The part the group hangs off, named and branded by the user. Null for frame. */
  containerType: string | null;
  /** Ordered list — only types with an installed component are shown */
  types: string[];
  canBatchReplace: boolean;
  /** Takes in every component whose type no group claims (custom, legacy, unknown) */
  isCatchAll?: boolean;
}

export const COMPONENT_GROUPS: ComponentGroupDef[] = [
  {
    id: "drivetrain",
    label: "Drivetrain",
    containerType: "drivetrain",
    types: ["chain", "cassette", "chainrings", "bottom_bracket", "pulley_wheels"],
    canBatchReplace: false,
  },
  {
    id: "front_wheel",
    label: "Front Wheel",
    containerType: "wheel_front",
    types: ["tire_front", "inner_tube_front", "brake_rotor_front"],
    canBatchReplace: true,
  },
  {
    id: "rear_wheel",
    label: "Rear Wheel",
    containerType: "wheel_rear",
    types: ["tire_rear", "inner_tube_rear", "brake_rotor_rear"],
    canBatchReplace: true,
  },
  {
    // Everything bolted to the frame rather than to a wheel. Brake pads live
    // here because they sit in the caliper and stay behind when a wheel comes
    // off. The catch-all flag also makes this the home for custom and legacy
    // parts, which previously floated below the groups with no heading.
    id: "frame",
    label: "Frame",
    containerType: null,
    types: [
      "brake_pads_front",
      "brake_pads_rear",
      "shifter_cables",
      "brake_cables",
      "cables",
      "bar_tape",
      "cleats",
    ],
    canBatchReplace: false,
    isCatchAll: true,
  },
];

/** All component types claimed by a named group — used to compute catch-all leftovers */
export const GROUPED_TYPES = new Set(COMPONENT_GROUPS.flatMap((g) => g.types));

/**
 * Component types that pause distance accumulation during indoor rides.
 *
 * Listed explicitly rather than derived from group membership: where a part is
 * *shown* and how its wear is *counted* are different questions. Brake pads
 * moved to the Frame group without their exclusion changing, and a future
 * regrouping must not silently move anyone's wear numbers either.
 */
export const TRAINER_PAUSE_TYPES = new Set([
  "tire_front",
  "tire_rear",
  "inner_tube_front",
  "inner_tube_rear",
  "brake_rotor_front",
  "brake_rotor_rear",
  "brake_pads_front",
  "brake_pads_rear",
  "brake_cables",
]);
