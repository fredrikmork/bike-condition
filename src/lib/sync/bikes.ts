import { supabaseAdmin } from "@/lib/supabase/server";
import { StravaClient } from "@/lib/strava/client";
import { getValidAccessToken } from "@/lib/strava/tokens";
import { createDefaultComponents } from "@/lib/components/defaults";
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
          // Calculate distance delta for component updates
          const previousDistance = existingBike.total_distance;
          const newDistance = gearDetails.distance;
          const distanceDelta = newDistance - previousDistance;

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

          // Update component distances if there's new distance
          if (distanceDelta > 0) {
            await updateComponentDistances(existingBike.id, distanceDelta);
          }

          // Fix default components that were created with 0 distance
          await migrateZeroDistanceComponents(existingBike.id, gearDetails.distance);

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

async function updateComponentDistances(
  bikeId: string,
  distanceDelta: number
): Promise<void> {
  // Get all active components for this bike
  const { data: components } = await supabaseAdmin
    .from("components")
    .select("id, current_distance")
    .eq("bike_id", bikeId)
    .is("replaced_at", null);

  if (!components || components.length === 0) return;

  // Update all component distances in parallel
  await Promise.all(
    components.map((component) =>
      supabaseAdmin
        .from("components")
        .update({
          current_distance: component.current_distance + distanceDelta,
        })
        .eq("id", component.id)
    )
  );
}

/**
 * One-time migration: fix components created with current_distance = 0
 * where the bike already had distance. Only affects components whose
 * installed_at matches created_at (i.e., default components never replaced).
 */
async function migrateZeroDistanceComponents(
  bikeId: string,
  bikeDistance: number
): Promise<void> {
  if (bikeDistance <= 0) return;

  const { data: components } = await supabaseAdmin
    .from("components")
    .select("id, current_distance, installed_at, created_at")
    .eq("bike_id", bikeId)
    .is("replaced_at", null)
    .eq("current_distance", 0);

  if (!components || components.length === 0) return;

  // Only migrate components where installed_at ≈ created_at (default components)
  const defaultComponents = components.filter((c) => {
    const installed = new Date(c.installed_at).getTime();
    const created = new Date(c.created_at).getTime();
    // Within 1 minute = default component (not manually replaced)
    return Math.abs(installed - created) < 60_000;
  });

  if (defaultComponents.length === 0) return;

  await Promise.all(
    defaultComponents.map((c) =>
      supabaseAdmin
        .from("components")
        .update({ current_distance: bikeDistance })
        .eq("id", c.id)
    )
  );
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
