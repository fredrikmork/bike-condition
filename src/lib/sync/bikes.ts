import { createDefaultComponents, DEFAULT_COMPONENTS } from "@/lib/components/defaults";
import { migrateDefaultDistances } from "@/lib/components/migrate-defaults";
import { createComponentsWithMounts } from "@/lib/components/mounts";
import { StravaClient } from "@/lib/strava/client";
import { getValidAccessToken } from "@/lib/strava/tokens";
import { fetchAllRows } from "@/lib/supabase/paginate";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { BikeInsert } from "@/lib/supabase/types";
import {
  type ActivityDistanceInput,
  computeComponentDistanceAcrossMounts,
  type MountDistanceInput,
} from "@/lib/sync/compute-distance";

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

    // Fetch existing bikes. Unlinked bikes (strava_gear_id NULL — freshly
    // transferred in) live outside Strava's world entirely: they can't be
    // matched, updated or retired by anything in this loop.
    const { data: existingBikes } = await supabaseAdmin
      .from("bikes")
      .select("id, strava_gear_id, total_distance")
      .eq("user_id", userId);

    const linkedBikes = (existingBikes ?? []).filter(
      (b): b is { id: string; strava_gear_id: string; total_distance: number | null } =>
        b.strava_gear_id !== null
    );
    const existingBikeMap = new Map(linkedBikes.map((b) => [b.strava_gear_id, b]));

    // Gear the user has SOLD through a transfer still sits in their Strava
    // until they retire it there. Without this guard the next sync would
    // recreate the sold bike from that gear, defaults and all.
    const { data: soldTransfers } = await supabaseAdmin
      .from("bike_transfers")
      .select("seller_strava_gear_id")
      .eq("seller_user_id", userId)
      .not("accepted_at", "is", null);
    const soldGearIds = new Set(
      (soldTransfers ?? []).map((t) => t.seller_strava_gear_id).filter((g) => g !== null)
    );

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

        // Sold and handed over — do not resurrect it from the seller's Strava.
        if (!existingBike && soldGearIds.has(stravaBike.id)) {
          return "skipped" as const;
        }

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
            addMissingDefaultComponents(existingBike.id, userId, gearDetails.distance),
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

          await createComponentsWithMounts(
            createDefaultComponents(newBike.id, userId, gearDetails.distance)
          );

          return "created" as const;
        }
      })
    );

    for (const r of bikeResults) {
      if (r.status === "fulfilled") {
        if (r.value === "skipped") continue; // sold gear, deliberately ignored
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
      linkedBikes,
      new Set(athlete.bikes.map((b) => b.id))
    );

    // Recompute wear for every part the user owns. This runs once per sync
    // rather than per bike: a rotated part draws distance from each bike it has
    // sat on, so it cannot be computed from a single bike's data.
    await recomputeComponentDistances(userId);

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
 * Callers must pass only LINKED bikes: an unlinked (transferred-in) bike is
 * absent from the owner's Strava by definition, and retiring it here would
 * kill every freshly received bike on its first sync.
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
 * Recompute current_distance for all of a user's active parts.
 *
 * A part accumulates distance over every bike it has been mounted on, so the
 * unit of work is the user, not the bike. Everything is fetched once and
 * combined in memory — at realistic volumes (hundreds of components, thousands
 * of activities) this is cheaper than the per-bike queries it replaced.
 *
 * Pure decision logic lives in `computeComponentDistanceAcrossMounts` (see that
 * module for the rules around TRAINER_PAUSE_TYPES, indoor rides and the
 * gear-distance fallback).
 */
export async function recomputeComponentDistances(userId: string): Promise<void> {
  const [{ data: components }, { data: bikes }] = await Promise.all([
    supabaseAdmin
      .from("components")
      .select("id, type, bike_id, bike_distance_at_install, installed_at, replaced_at")
      .eq("user_id", userId)
      .is("replaced_at", null),
    supabaseAdmin.from("bikes").select("id, total_distance").eq("user_id", userId),
  ]);

  if (!components || components.length === 0) return;

  const bikeIds = (bikes ?? []).map((b) => b.id);
  const bikeTotalDistanceById = new Map((bikes ?? []).map((b) => [b.id, b.total_distance ?? 0]));

  // Both of these can exceed PostgREST's 1000-row cap for an active rider, and
  // a truncated activity list silently under-reports wear — hence fetchAllRows.
  const [allActivities, allMounts] = await Promise.all([
    bikeIds.length > 0
      ? fetchAllRows<ActivityDistanceInput & { bike_id: string | null }>((from, to) =>
          supabaseAdmin
            .from("activities")
            .select("bike_id, distance, activity_type, start_date, trainer")
            .in("bike_id", bikeIds)
            .range(from, to)
        )
      : Promise.resolve([]),
    fetchAllRows<MountDistanceInput & { component_id: string }>((from, to) =>
      supabaseAdmin
        .from("component_mounts")
        .select(
          "component_id, bike_id, mounted_at, unmounted_at, bike_distance_at_mount, bike_distance_at_unmount"
        )
        .in(
          "component_id",
          components.map((c) => c.id)
        )
        .range(from, to)
    ),
  ]);

  const activitiesByBike = new Map<string, ActivityDistanceInput[]>();
  for (const activity of allActivities) {
    if (!activity.bike_id) continue;
    const list = activitiesByBike.get(activity.bike_id) ?? [];
    list.push(activity);
    activitiesByBike.set(activity.bike_id, list);
  }

  const mountsByComponent = new Map<string, MountDistanceInput[]>();
  for (const mount of allMounts) {
    const list = mountsByComponent.get(mount.component_id) ?? [];
    list.push(mount);
    mountsByComponent.set(mount.component_id, list);
  }

  await Promise.all(
    components.map(async (component) => {
      const current_distance = computeComponentDistanceAcrossMounts(
        component,
        mountsByComponent.get(component.id) ?? [],
        activitiesByBike,
        bikeTotalDistanceById
      );
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
  userId: string,
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

  await createComponentsWithMounts(
    missingDefaults.map((d) => ({
      bike_id: bikeId,
      user_id: userId,
      name: d.name,
      type: d.type,
      recommended_distance: d.recommended_distance,
      current_distance: bikeTotalDistance,
      bike_distance_at_install: 0, // assumed on since beginning
    }))
  );
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
