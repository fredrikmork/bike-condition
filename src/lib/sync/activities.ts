import { supabaseAdmin } from "@/lib/supabase/server";
import { StravaClient } from "@/lib/strava/client";
import { getValidAccessToken } from "@/lib/strava/tokens";
import type { ActivityInsert } from "@/lib/supabase/types";

interface SyncActivitiesResult {
  synced: number;
  skipped: number;
  errors: string[];
}

interface SyncActivitiesOptions {
  fullSync?: boolean;
}

export async function syncActivities(
  userId: string,
  options: SyncActivitiesOptions = {}
): Promise<SyncActivitiesResult> {
  const result: SyncActivitiesResult = {
    synced: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // Get valid access token
    const accessToken = await getValidAccessToken(userId);
    const client = new StravaClient(accessToken);

    // Fetch sync status and bikes in parallel
    const [{ data: syncStatus }, { data: bikes }] = await Promise.all([
      supabaseAdmin
        .from("sync_status")
        .select("last_activity_sync")
        .eq("user_id", userId)
        .single(),
      supabaseAdmin
        .from("bikes")
        .select("id, strava_gear_id")
        .eq("user_id", userId),
    ]);

    // Determine sync window:
    //   - explicit full resync: from epoch (all history)
    //   - incremental: from last successful sync timestamp
    //   - first-time (no last_activity_sync): last 90 days only
    //     → keeps the first sync well within Vercel Hobby's 10 s hard limit.
    //     Component wear is still accurate because the gear-based fallback
    //     (bike.total_distance − bike_distance_at_install) covers all older rides.
    const OVERLAP_MS = 7 * 24 * 60 * 60 * 1000; // 7 days — catches late-posted activities
    const lastSync = options.fullSync
      ? new Date(0)
      : syncStatus?.last_activity_sync
        ? new Date(new Date(syncStatus.last_activity_sync as string).getTime() - OVERLAP_MS)
        : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago (first sync)

    // Full re-sync: delete existing activities so we rebuild from scratch
    if (options.fullSync) {
      await supabaseAdmin
        .from("activities")
        .delete()
        .eq("user_id", userId);
    }

    // Cap pages: explicit full sync = 200; everything else = 10 (incremental
    // and first-time both stay well within 10 s on Hobby plan)
    const maxPages = options.fullSync ? 200 : 10;
    const activities = await client.getAllActivitiesSince(lastSync, maxPages);

    if (activities.length === 0) {
      return result;
    }

    const bikeMap = new Map(bikes?.map((b) => [b.strava_gear_id, b.id]) || []);

    // Skip dedup query when we just deleted everything (full sync) or when
    // there was no previous sync (first-time users have no existing activities)
    let existingIds = new Set<number>();          // fully handled — skip
    let existingNullBikeIds = new Set<number>();  // in DB with bike_id=null — re-evaluate
    if (!options.fullSync && syncStatus?.last_activity_sync) {
      const activityIds = activities.map((a) => a.id);
      const { data: existingActivities } = await supabaseAdmin
        .from("activities")
        .select("strava_activity_id, bike_id")
        .in("strava_activity_id", activityIds);
      for (const existing of existingActivities ?? []) {
        if (existing.bike_id !== null) {
          existingIds.add(existing.strava_activity_id);
        } else {
          existingNullBikeIds.add(existing.strava_activity_id);
        }
      }
    }

    // Process activities
    const newActivities: ActivityInsert[] = [];
    const bikeIdUpdates: { strava_activity_id: number; bike_id: string }[] = [];

    for (const activity of activities) {
      if (existingIds.has(activity.id)) {
        result.skipped++;
        continue;
      }

      // Prefer sport_type (new Strava field) over the deprecated type field
      const activityType = activity.sport_type ?? activity.type;

      // Only sync cycling activities
      const cyclingTypes = ["Ride", "VirtualRide", "EBikeRide", "Handcycle", "Velomobile"];
      if (!cyclingTypes.includes(activityType)) {
        result.skipped++;
        continue;
      }

      const bikeId = activity.gear_id ? (bikeMap.get(activity.gear_id) ?? null) : null;

      if (existingNullBikeIds.has(activity.id)) {
        // Activity is already in DB with bike_id=null — update if we can now resolve it
        if (bikeId !== null) {
          bikeIdUpdates.push({ strava_activity_id: activity.id, bike_id: bikeId });
        } else {
          result.skipped++;
        }
        continue;
      }

      newActivities.push({
        user_id: userId,
        bike_id: bikeId,
        strava_activity_id: activity.id,
        name: activity.name,
        distance: Math.round(activity.distance),
        moving_time: activity.moving_time,
        start_date: activity.start_date,
        activity_type: activityType,
      });
    }

    // Insert new activities in parallel batches
    if (newActivities.length > 0) {
      const batchSize = 100;
      const batches: ActivityInsert[][] = [];
      for (let i = 0; i < newActivities.length; i += batchSize) {
        batches.push(newActivities.slice(i, i + batchSize));
      }

      const insertResults = await Promise.all(
        batches.map((batch) => supabaseAdmin.from("activities").insert(batch))
      );

      insertResults.forEach(({ error }, i) => {
        if (error) {
          result.errors.push(`Failed to insert activities batch: ${error.message}`);
        } else {
          result.synced += batches[i].length;
        }
      });
    }

    // Fix activities previously saved with bike_id=null that can now be linked
    if (bikeIdUpdates.length > 0) {
      await Promise.all(
        bikeIdUpdates.map(({ strava_activity_id, bike_id }) =>
          supabaseAdmin
            .from("activities")
            .update({ bike_id })
            .eq("strava_activity_id", strava_activity_id)
        )
      );
      result.synced += bikeIdUpdates.length;
    }

    // Update sync status
    await supabaseAdmin
      .from("sync_status")
      .upsert({
        user_id: userId,
        last_activity_sync: new Date().toISOString(),
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

