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
 * Compute the current_distance for a single component, given the bike's full
 * activity history and Strava-reported total distance.
 *
 * Rules:
 * - All components: distance is MAX(activity sum since installed_at, gear distance)
 *   where gear distance = bike.total_distance - component.bike_distance_at_install.
 * - TRAINER_PAUSE_TYPES (wheels + brake cables) exclude indoor activities
 *   (Strava trainer flag, or VirtualRide sport type) from the activity sum.
 * - When the bike has at least one indoor ride on record, the gear-distance
 *   fallback is skipped for TRAINER_PAUSE_TYPES (Strava's total includes indoor
 *   km, which would defeat the exclusion). Without any indoor ride on the bike,
 *   the fallback is safe and lets pre-existing Strava mileage propagate to
 *   wheel components on first sync.
 */
export function computeComponentDistance(
  component: ComponentDistanceInput,
  bikeActivities: readonly ActivityDistanceInput[],
  bikeTotalDistance: number
): number {
  const isOutdoorOnly = TRAINER_PAUSE_TYPES.has(component.type);
  const hasIndoorRides = bikeActivities.some(isIndoorRide);
  const installedAtMs = new Date(component.installed_at).getTime();

  const activityDistance = bikeActivities
    .filter((a) => new Date(a.start_date).getTime() >= installedAtMs)
    .filter((a) => !isOutdoorOnly || !isIndoorRide(a))
    .reduce((sum, a) => sum + a.distance, 0);

  const gearDistance = bikeTotalDistance - component.bike_distance_at_install;
  const skipGearFallback = isOutdoorOnly && hasIndoorRides;

  return skipGearFallback ? activityDistance : Math.max(activityDistance, gearDistance);
}
