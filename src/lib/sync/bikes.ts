import { createDefaultComponents, DEFAULT_COMPONENTS } from "@/lib/components/defaults";
import { migrateDefaultDistances } from "@/lib/components/migrate-defaults";
import { StravaClient } from "@/lib/strava/client";
import { getValidAccessToken } from "@/lib/strava/tokens";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { BikeInsert } from "@/lib/supabase/types";
import { computeComponentDistance } from "@/lib/sync/compute-distance";

interface SyncBikesResult {
  synced: number;
  created: number;
  updated: number;
  retired: number;
  errors: string[];
}

export async function syncBikes(userId: string): Promise<SyncBikesResult> {
  const result: SyncBikesResult = {
    synced: 0,
    created: 0,
    updated: 0,
    retired: 0,
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

    // Fetch existing bikes
    const { data: existingBikes } = await supabaseAdmin
      .from("bikes")
      .select("id, strava_gear_id, total_distance")
      .eq("user_id", userId);

    const existingBikeMap = new Map(existingBikes?.map((b) => [b.strava_gear_id, b]) || []);

    // Fetch all gear details in parallel instead of sequentially
    const gearResults = await Promise.allSettled(athlete.bikes.map((b) => client.getGear(b.id)));

    // Process all bikes in parallel
    const bikeResults = await Promise.allSettled(
      athlete.bikes.map(async (stravaBike, i) => {
        const gearResult = gearResults[i];
        if (gearResult.status === "rejected") {
          throw new Error(
            `Failed to fetch gear for ${stravaBike.name}: ${gearResult.reason instanceof Error ? gearResult.reason.message : String(gearResult.reason)}`
          );
        }
        const gearDetails = gearResult.value;
        const existingBike = existingBikeMap.get(stravaBike.id);

        if (existingBike) {
          // Run bike update and component operations in parallel
          await Promise.all([
            supabaseAdmin
              .from("bikes")
              .update({
                name: gearDetails.name,
                brand_name: gearDetails.brand_name ?? null,
                model_name: gearDetails.model_name ?? null,
                frame_type: gearDetails.frame_type ?? null,
                description: gearDetails.description ?? null,
                total_distance: gearDetails.distance,
                // Present in `/athlete` ⇒ not retired. Un-retires a bike the
                // user brought back on Strava. See retireMissingBikes().
                retired: false,
                weight: gearDetails.weight ?? null,
              })
              .eq("id", existingBike.id),
            updateComponentDistancesFromActivities(existingBike.id, gearDetails.distance),
            addMissingDefaultComponents(existingBike.id, gearDetails.distance),
          ]);
          return "updated" as const;
        } else {
          const bikeInsert: BikeInsert = {
            user_id: userId,
            strava_gear_id: stravaBike.id,
            name: gearDetails.name,
            brand_name: gearDetails.brand_name ?? null,
            model_name: gearDetails.model_name ?? null,
            frame_type: gearDetails.frame_type ?? null,
            description: gearDetails.description ?? null,
            total_distance: gearDetails.distance,
            retired: false, // only non-retired gear reaches us via `/athlete`
            weight: gearDetails.weight ?? null,
          };

          const { data: newBike, error: insertError } = await supabaseAdmin
            .from("bikes")
            .insert(bikeInsert)
            .select("id")
            .single();

          if (insertError || !newBike) {
            throw new Error(`Failed to create bike ${gearDetails.name}: ${insertError?.message}`);
          }

          const defaultComponents = createDefaultComponents(newBike.id, gearDetails.distance);
          await supabaseAdmin.from("components").insert(defaultComponents);

          return "created" as const;
        }
      })
    );

    for (const r of bikeResults) {
      if (r.status === "fulfilled") {
        result.synced++;
        if (r.value === "updated") result.updated++;
        else result.created++;
      } else {
        result.errors.push(r.reason instanceof Error ? r.reason.message : String(r.reason));
      }
    }

    // Retire bikes that vanished from Strava. `/athlete` only returns non-retired
    // gear, so a bike disappearing from the list IS the retirement signal — the
    // `retired` field on gear details never comes back true through this path.
    // Bikes still in the list are un-retired above via `retired: ... ?? false`.
    result.retired = await retireMissingBikes(
      userId,
      existingBikes ?? [],
      new Set(athlete.bikes.map((b) => b.id))
    );

    // Compute dominant sport type per bike from activity history
    await updateDominantSportTypes(userId);

    // Migrate any components still using old default recommended distances
    await migrateDefaultDistances();

    // Update sync status
    await supabaseAdmin.from("sync_status").upsert(
      {
        user_id: userId,
        last_bike_sync: new Date().toISOString(),
        last_sync_error: result.errors.length > 0 ? result.errors.join("; ") : null,
      },
      {
        onConflict: "user_id",
      }
    );

    return result;
  } catch (error) {
    result.errors.push(`Sync failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    return result;
  }
}

/**
 * Mark bikes as retired when they no longer appear in the athlete's gear list.
 *
 * Strava's `/athlete` endpoint omits retired gear entirely, so absence is the
 * only signal we get — `DetailedGear.retired` is unreachable for those bikes
 * because we can never learn their ids again. A bike deleted on Strava also
 * disappears; treating that as retired keeps its wear history readable.
 *
 * Returns the number of bikes newly retired.
 */
async function retireMissingBikes(
  userId: string,
  existingBikes: { id: string; strava_gear_id: string }[],
  stravaGearIds: Set<string>
): Promise<number> {
  const missingIds = existingBikes
    .filter((b) => !stravaGearIds.has(b.strava_gear_id))
    .map((b) => b.id);

  if (missingIds.length === 0) return 0;

  const { data } = await supabaseAdmin
    .from("bikes")
    .update({ retired: true })
    .eq("user_id", userId)
    .eq("retired", false)
    .in("id", missingIds)
    .select("id");

  return data?.length ?? 0;
}

/**
 * Update all active component distances from the bike's activity history.
 * Pure decision logic lives in `computeComponentDistance` (see that module for
 * the rules around TRAINER_PAUSE_TYPES, virtual rides, and gear fallback).
 */
async function updateComponentDistancesFromActivities(
  bikeId: string,
  bikeTotalDistance: number
): Promise<void> {
  const { data: components } = await supabaseAdmin
    .from("components")
    .select("id, type, bike_distance_at_install, installed_at")
    .eq("bike_id", bikeId)
    .is("replaced_at", null);

  if (!components || components.length === 0) return;

  const { data: allActivities } = await supabaseAdmin
    .from("activities")
    .select("distance, activity_type, start_date, trainer")
    .eq("bike_id", bikeId);

  const activities = allActivities ?? [];

  await Promise.all(
    components.map(async (component) => {
      const current_distance = computeComponentDistance(component, activities, bikeTotalDistance);
      await supabaseAdmin.from("components").update({ current_distance }).eq("id", component.id);
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

  // Remove obsolete component types
  const obsoleteTypes = new Set(["bar_tape", "brake_pads"]);
  const obsoleteIds = existingComponents.filter((c) => obsoleteTypes.has(c.type)).map((c) => c.id);

  if (obsoleteIds.length > 0) {
    await supabaseAdmin.from("components").delete().in("id", obsoleteIds);
  }

  // Build existingTypes after filtering out deleted obsolete entries
  const existingTypes = new Set(
    existingComponents.filter((c) => !obsoleteTypes.has(c.type)).map((c) => c.type)
  );

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

/**
 * Compute the dominant activity sport type for each bike from the user's activity
 * history and update default_sport_type accordingly.
 */
async function updateDominantSportTypes(userId: string): Promise<void> {
  const { data: activities } = await supabaseAdmin
    .from("activities")
    .select("bike_id, activity_type")
    .eq("user_id", userId)
    .not("bike_id", "is", null)
    .not("activity_type", "is", null);

  if (!activities || activities.length === 0) return;

  // Count occurrences of each sport type per bike
  const counts = new Map<string, Map<string, number>>();
  for (const a of activities) {
    if (!a.bike_id || !a.activity_type) continue;
    if (!counts.has(a.bike_id)) counts.set(a.bike_id, new Map());
    const m = counts.get(a.bike_id)!;
    m.set(a.activity_type, (m.get(a.activity_type) ?? 0) + 1);
  }

  await Promise.all(
    Array.from(counts.entries()).map(([bikeId, typeCounts]) => {
      const dominant = [...typeCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
      return supabaseAdmin
        .from("bikes")
        .update({ default_sport_type: dominant })
        .eq("id", bikeId)
        .eq("user_id", userId);
    })
  );
}
