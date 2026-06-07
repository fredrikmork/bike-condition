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
}

/**
 * Compute the current_distance for a single component, given the bike's full
 * activity history and Strava-reported total distance.
 *
 * Rules:
 * - All components: distance is MAX(activity sum since installed_at, gear distance)
 *   where gear distance = bike.total_distance - component.bike_distance_at_install.
 * - TRAINER_PAUSE_TYPES (wheels + brake cables) exclude VirtualRide activities
 *   from the activity sum.
 * - When the bike has at least one VirtualRide on record, the gear-distance
 *   fallback is skipped for TRAINER_PAUSE_TYPES (Strava's total includes virtual
 *   km, which would defeat the exclusion). Without any VirtualRide on the bike,
 *   the fallback is safe and lets pre-existing Strava mileage propagate to
 *   wheel components on first sync.
 */
export function computeComponentDistance(
  component: ComponentDistanceInput,
  bikeActivities: readonly ActivityDistanceInput[],
  bikeTotalDistance: number
): number {
  const isOutdoorOnly = TRAINER_PAUSE_TYPES.has(component.type);
  const hasVirtualRides = bikeActivities.some((a) => a.activity_type === "VirtualRide");
  const installedAtMs = new Date(component.installed_at).getTime();

  const activityDistance = bikeActivities
    .filter((a) => new Date(a.start_date).getTime() >= installedAtMs)
    .filter((a) => !isOutdoorOnly || a.activity_type !== "VirtualRide")
    .reduce((sum, a) => sum + a.distance, 0);

  const gearDistance = bikeTotalDistance - component.bike_distance_at_install;
  const skipGearFallback = isOutdoorOnly && hasVirtualRides;

  return skipGearFallback ? activityDistance : Math.max(activityDistance, gearDistance);
}
