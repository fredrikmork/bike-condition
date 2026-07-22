/**
 * A container is a part that carries no wear of its own but holds other parts:
 * a wheel holds its tire, inner tube and rotor; the drivetrain holds the chain,
 * cassette and the rest of the groupset. It exists as an ordinary `components`
 * row so it can be named, given a brand and model, and — later — moved between
 * bikes as one unit through the same mount machinery.
 *
 * Containers are stored with `recommended_distance = 0`, which is what keeps
 * them out of the notification query. Nothing may run them through
 * `calculateComponentWear`: dividing by zero there reads as 100% and shows up
 * as a critical component that can never be fixed.
 */

/** Parts each container holds. Adding a container starts here. */
const CHILDREN_OF_CONTAINER: Record<string, string[]> = {
  wheel_front: ["tire_front", "inner_tube_front", "brake_rotor_front"],
  wheel_rear: ["tire_rear", "inner_tube_rear", "brake_rotor_rear"],
  drivetrain: ["chain", "cassette", "chainrings", "bottom_bracket", "pulley_wheels"],
};

export const CONTAINER_TYPES = new Set(Object.keys(CHILDREN_OF_CONTAINER));

export function isContainerType(type: string): boolean {
  return CONTAINER_TYPES.has(type);
}

/** Reverse lookup: which container a part belongs under, if any. */
const CONTAINER_OF_CHILD = new Map<string, string>(
  Object.entries(CHILDREN_OF_CONTAINER).flatMap(([container, children]) =>
    children.map((child) => [child, container] as const)
  )
);

export function getContainerTypeFor(type: string): string | null {
  return CONTAINER_OF_CHILD.get(type) ?? null;
}

/**
 * The containers every bike is expected to have. Created alongside the rest of
 * a bike's defaults; `linkPartsToContainers` in `mounts.ts` hangs the parts off
 * them afterwards.
 */
export const CONTAINER_DEFAULTS: { name: string; type: string }[] = [
  { name: "Front Wheel", type: "wheel_front" },
  { name: "Rear Wheel", type: "wheel_rear" },
  { name: "Drivetrain", type: "drivetrain" },
];
