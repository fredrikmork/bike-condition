import { supabaseAdmin } from "@/lib/supabase/server";
import { StravaClient } from "@/lib/strava/client";
import { getValidAccessToken } from "@/lib/strava/tokens";
import { createDefaultComponents, DEFAULT_COMPONENTS } from "@/lib/components/defaults";
import type { Bike, BikeInsert } from "@/lib/supabase/types";

interface SyncBikesResult {
  synced: number;
  created: number;
  updated: number;
  errors: string[];
}

export async function syncBikes(userId: string): Promise<SyncBikesResult> {
  const result: SyncBikesResult = {
    synced: 0,
    created: 0,
    updated: 0,
    errors: [],
  };

  try {
    // Get valid access token
    const accessToken = await getValidAccessToken(userId);
    const client = new StravaClient(accessToken);

    // Get athlete data (includes bikes list)
    const athlete = await client.getAthlete();

    if (!athlete.bikes || athlete.bikes.length === 0) {
      return result;
    }

    // Get existing bikes for this user
    const { data: existingBikes } = await supabaseAdmin
      .from("bikes")
      .select("id, strava_gear_id, total_distance")
      .eq("user_id", userId);

    const existingBikeMap = new Map(
      existingBikes?.map((b) => [b.strava_gear_id, b]) || []
    );

    // Process each bike from Strava
    for (const stravaBike of athlete.bikes) {
      try {
        // Fetch full gear details
        const gearDetails = await client.getGear(stravaBike.id);

        const existingBike = existingBikeMap.get(stravaBike.id);

        if (existingBike) {
          // Update existing bike
          await supabaseAdmin
            .from("bikes")
            .update({
              name: gearDetails.name,
              brand_name: gearDetails.brand_name ?? null,
              model_name: gearDetails.model_name ?? null,
              frame_type: gearDetails.frame_type ?? null,
              description: gearDetails.description ?? null,
              total_distance: gearDetails.distance,
              is_primary: gearDetails.primary,
            })
            .eq("id", existingBike.id);

          // Update component distances using activity data + gear fallback
          await updateComponentDistancesFromActivities(existingBike.id, gearDetails.distance);

          // Add any missing default component types
          await addMissingDefaultComponents(existingBike.id, gearDetails.distance);

          result.updated++;
        } else {
          // Create new bike
          const bikeInsert: BikeInsert = {
            user_id: userId,
            strava_gear_id: stravaBike.id,
            name: gearDetails.name,
            brand_name: gearDetails.brand_name ?? null,
            model_name: gearDetails.model_name ?? null,
            frame_type: gearDetails.frame_type ?? null,
            description: gearDetails.description ?? null,
            total_distance: gearDetails.distance,
            is_primary: gearDetails.primary,
          };

          const { data: newBike, error: insertError } = await supabaseAdmin
            .from("bikes")
            .insert(bikeInsert)
            .select("id")
            .single();

          if (insertError || !newBike) {
            result.errors.push(
              `Failed to create bike ${gearDetails.name}: ${insertError?.message}`
            );
            continue;
          }

          // Create default components for new bike with the bike's current distance
          const defaultComponents = createDefaultComponents(
            newBike.id,
            gearDetails.distance
          );
          await supabaseAdmin.from("components").insert(defaultComponents);

          result.created++;
        }

        result.synced++;
      } catch (error) {
        result.errors.push(
          `Error syncing bike ${stravaBike.name}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    // Update sync status
    await supabaseAdmin
      .from("sync_status")
      .upsert({
        user_id: userId,
        last_bike_sync: new Date().toISOString(),
        last_sync_error: result.errors.length > 0 ? result.errors.join("; ") : null,
      }, {
        onConflict: "user_id",
      });

    return result;
  } catch (error) {
    result.errors.push(
      `Sync failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    return result;
  }
}

/**
 * Update all active component distances using the higher of:
 * 1. Activity-based: SUM(activities.distance) WHERE bike_id AND start_date >= installed_at
 * 2. Gear-based:     bike.total_distance - component.bike_distance_at_install
 *
 * Taking MAX ensures we never under-report: if the gear API is stale, activity
 * data wins; if activities are incomplete, gear data wins.
 */
async function updateComponentDistancesFromActivities(
  bikeId: string,
  bikeTotalDistance: number
): Promise<void> {
  const { data: components } = await supabaseAdmin
    .from("components")
    .select("id, bike_distance_at_install, installed_at")
    .eq("bike_id", bikeId)
    .is("replaced_at", null);

  if (!components || components.length === 0) return;

  await Promise.all(
    components.map(async (component) => {
      const gearDistance = bikeTotalDistance - component.bike_distance_at_install;

      // Sum activity distances for this bike since the component was installed
      const { data: activitySum } = await supabaseAdmin
        .from("activities")
        .select("distance")
        .eq("bike_id", bikeId)
        .gte("start_date", component.installed_at);

      const activityDistance = activitySum?.reduce((sum, a) => sum + a.distance, 0) ?? 0;

      await supabaseAdmin
        .from("components")
        .update({
          current_distance: Math.max(activityDistance, gearDistance),
        })
        .eq("id", component.id);
    })
  );
}

/**
 * Add missing default component types to an existing bike.
 * Removes obsolete types (bar_tape, brake_pads) and adds new ones.
 * Respects deleted_defaults — types the user explicitly removed.
 */
async function addMissingDefaultComponents(
  bikeId: string,
  bikeTotalDistance: number
): Promise<void> {
  const { data: existingComponents } = await supabaseAdmin
    .from("components")
    .select("id, type")
    .eq("bike_id", bikeId)
    .is("replaced_at", null);

  if (!existingComponents) return;

  // Fetch bike's deleted_defaults to skip user-removed types
  const { data: bike } = await supabaseAdmin
    .from("bikes")
    .select("deleted_defaults")
    .eq("id", bikeId)
    .single();

  const deletedDefaults = new Set(bike?.deleted_defaults ?? []);
  const existingTypes = new Set(existingComponents.map((c) => c.type));

  // Remove obsolete component types
  const obsoleteTypes = ["bar_tape", "brake_pads"];
  const obsoleteIds = existingComponents
    .filter((c) => obsoleteTypes.includes(c.type))
    .map((c) => c.id);

  if (obsoleteIds.length > 0) {
    await supabaseAdmin
      .from("components")
      .delete()
      .in("id", obsoleteIds);
  }

  // Add missing default component types (skip user-deleted ones)
  const missingDefaults = DEFAULT_COMPONENTS.filter(
    (d) => !existingTypes.has(d.type) && !deletedDefaults.has(d.type)
  );

  if (missingDefaults.length > 0) {
    const inserts = missingDefaults.map((d) => ({
      bike_id: bikeId,
      name: d.name,
      type: d.type,
      recommended_distance: d.recommended_distance,
      current_distance: bikeTotalDistance,
      bike_distance_at_install: 0, // assumed on since beginning
    }));

    await supabaseAdmin.from("components").insert(inserts);
  }
}

export async function getBikeByStravaId(
  userId: string,
  stravaGearId: string
): Promise<Bike | null> {
  const { data } = await supabaseAdmin
    .from("bikes")
    .select("*")
    .eq("user_id", userId)
    .eq("strava_gear_id", stravaGearId)
    .single();

  return data;
}
