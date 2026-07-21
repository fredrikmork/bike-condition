import { TRAINER_PAUSE_TYPES } from "@/lib/components/groups";

export interface ComponentDistanceInput {
  type: string;
  bike_distance_at_install: number;
  installed_at: string;
}

export interface ActivityDistanceInput {
  distance: number;
  activity_type: string | null;
  start_date: string;
  /** Strava trainer flag — true for indoor/stationary-trainer rides */
  trainer?: boolean | null;
}

/** One period a part sat on a bike. Mirrors a `component_mounts` row. */
export interface MountDistanceInput {
  bike_id: string;
  mounted_at: string;
  /** null while the part is still on the bike */
  unmounted_at: string | null;
  bike_distance_at_mount: number;
  /** Bike's Strava total when the part came off; null while still mounted */
  bike_distance_at_unmount: number | null;
}

/**
 * An activity counts as "indoor" (and is excluded from wheel/cable wear) when
 * Strava flags it as a trainer ride OR its sport type is VirtualRide. The
 * trainer flag is the authoritative signal; the VirtualRide check is kept for
 * older activities synced before the flag was captured.
 */
function isIndoorRide(activity: ActivityDistanceInput): boolean {
  return activity.trainer === true || activity.activity_type === "VirtualRide";
}

/**
 * Distance a part picked up during a single period on a single bike.
 *
 * Rules:
 * - Distance is MAX(activity sum within the window, gear distance), where gear
 *   distance is how far the bike itself travelled over the same period.
 * - TRAINER_PAUSE_TYPES (wheels + brake cables) exclude indoor activities.
 * - When the bike has any indoor ride on record, the gear-distance fallback is
 *   skipped for those types, because Strava's total includes indoor km and
 *   would defeat the exclusion. Without an indoor ride the fallback is safe and
 *   lets pre-existing Strava mileage propagate on first sync.
 */
function computeMountDistance(
  isOutdoorOnly: boolean,
  bikeActivities: readonly ActivityDistanceInput[],
  windowStartMs: number,
  windowEndMs: number,
  gearDistance: number
): number {
  const hasIndoorRides = bikeActivities.some(isIndoorRide);

  const activityDistance = bikeActivities
    .filter((a) => {
      const t = new Date(a.start_date).getTime();
      return t >= windowStartMs && t < windowEndMs;
    })
    .filter((a) => !isOutdoorOnly || !isIndoorRide(a))
    .reduce((sum, a) => sum + a.distance, 0);

  const skipGearFallback = isOutdoorOnly && hasIndoorRides;

  return skipGearFallback ? activityDistance : Math.max(activityDistance, gearDistance);
}

/**
 * Compute the current_distance for a component that has only ever sat on one
 * bike, given that bike's full activity history and Strava-reported total.
 *
 * Kept as the single-mount primitive: `computeComponentDistanceAcrossMounts`
 * reduces to exactly this for a part that has never been moved.
 */
export function computeComponentDistance(
  component: ComponentDistanceInput,
  bikeActivities: readonly ActivityDistanceInput[],
  bikeTotalDistance: number
): number {
  return computeMountDistance(
    TRAINER_PAUSE_TYPES.has(component.type),
    bikeActivities,
    new Date(component.installed_at).getTime(),
    Number.POSITIVE_INFINITY,
    bikeTotalDistance - component.bike_distance_at_install
  );
}

/**
 * Compute the current_distance for a part across every bike it has sat on.
 *
 * Each mount period contributes the distance picked up on that bike between
 * mount and unmount; the total is their sum. Periods are disjoint in time, so
 * no distance is counted twice.
 *
 * A part with no mount rows at all falls back to a synthetic period derived
 * from `installed_at` / `bike_distance_at_install` — the pre-rotation shape.
 * That keeps a component whose mount row failed to be written computing exactly
 * as it did before, rather than dropping to zero.
 */
export function computeComponentDistanceAcrossMounts(
  component: ComponentDistanceInput & { bike_id: string | null; replaced_at?: string | null },
  mounts: readonly MountDistanceInput[],
  activitiesByBike: ReadonlyMap<string, readonly ActivityDistanceInput[]>,
  bikeTotalDistanceById: ReadonlyMap<string, number>
): number {
  const effectiveMounts = mounts.length > 0 ? mounts : syntheticMounts(component);
  const isOutdoorOnly = TRAINER_PAUSE_TYPES.has(component.type);

  return effectiveMounts.reduce((total, mount) => {
    const bikeActivities = activitiesByBike.get(mount.bike_id) ?? [];
    // While a part is still mounted, the bike's live total closes the window.
    const bikeTotalAtEnd =
      mount.bike_distance_at_unmount ?? bikeTotalDistanceById.get(mount.bike_id) ?? 0;

    return (
      total +
      computeMountDistance(
        isOutdoorOnly,
        bikeActivities,
        new Date(mount.mounted_at).getTime(),
        mount.unmounted_at ? new Date(mount.unmounted_at).getTime() : Number.POSITIVE_INFINITY,
        bikeTotalAtEnd - mount.bike_distance_at_mount
      )
    );
  }, 0);
}

/** Pre-rotation shape of a component, expressed as a single mount period. */
function syntheticMounts(
  component: ComponentDistanceInput & { bike_id: string | null; replaced_at?: string | null }
): MountDistanceInput[] {
  if (!component.bike_id) return [];

  return [
    {
      bike_id: component.bike_id,
      mounted_at: component.installed_at,
      unmounted_at: component.replaced_at ?? null,
      bike_distance_at_mount: component.bike_distance_at_install,
      bike_distance_at_unmount: null,
    },
  ];
}
