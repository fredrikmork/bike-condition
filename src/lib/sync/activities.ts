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

    // Get last sync timestamp
    const { data: syncStatus } = await supabaseAdmin
      .from("sync_status")
      .select("last_activity_sync")
      .eq("user_id", userId)
      .single();

    // Fetch all history on first sync or when full resync is requested
    const isFullSync = options.fullSync || !syncStatus?.last_activity_sync;
    const lastSync = isFullSync
      ? new Date(0) // epoch — fetch entire activity history
      : new Date(syncStatus.last_activity_sync as string);

    // Full re-sync: delete existing activities so we rebuild from scratch
    if (options.fullSync) {
      await supabaseAdmin
        .from("activities")
        .delete()
        .eq("user_id", userId);
    }

    // Full sync: no page limit (default 200 safety cap); incremental: 10 pages
    const maxPages = isFullSync ? undefined : 10;
    const activities = await client.getAllActivitiesSince(lastSync, maxPages);

    if (activities.length === 0) {
      return result;
    }

    // Get user's bikes for mapping gear_id
    const { data: bikes } = await supabaseAdmin
      .from("bikes")
      .select("id, strava_gear_id")
      .eq("user_id", userId);

    const bikeMap = new Map(bikes?.map((b) => [b.strava_gear_id, b.id]) || []);

    // Get existing activities to avoid duplicates
    const activityIds = activities.map((a) => a.id);
    const { data: existingActivities } = await supabaseAdmin
      .from("activities")
      .select("strava_activity_id")
      .in("strava_activity_id", activityIds);

    const existingIds = new Set(
      existingActivities?.map((a) => a.strava_activity_id) || []
    );

    // Process activities
    const newActivities: ActivityInsert[] = [];

    for (const activity of activities) {
      if (existingIds.has(activity.id)) {
        result.skipped++;
        continue;
      }

      // Only sync cycling activities
      const cyclingTypes = ["Ride", "VirtualRide", "EBikeRide", "Handcycle", "Velomobile"];
      if (!cyclingTypes.includes(activity.type)) {
        result.skipped++;
        continue;
      }

      const bikeId = activity.gear_id ? bikeMap.get(activity.gear_id) : null;

      newActivities.push({
        user_id: userId,
        bike_id: bikeId ?? null,
        strava_activity_id: activity.id,
        name: activity.name,
        distance: Math.round(activity.distance),
        moving_time: activity.moving_time,
        start_date: activity.start_date,
        activity_type: activity.type,
      });
    }

    // Insert new activities in batches
    if (newActivities.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < newActivities.length; i += batchSize) {
        const batch = newActivities.slice(i, i + batchSize);
        const { error } = await supabaseAdmin.from("activities").insert(batch);

        if (error) {
          result.errors.push(`Failed to insert activities batch: ${error.message}`);
        } else {
          result.synced += batch.length;
        }
      }
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

export async function getActivityStats(userId: string): Promise<{
  totalActivities: number;
  totalDistance: number;
  last30Days: {
    activities: number;
    distance: number;
  };
}> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: allActivities } = await supabaseAdmin
    .from("activities")
    .select("distance")
    .eq("user_id", userId);

  const { data: recentActivities } = await supabaseAdmin
    .from("activities")
    .select("distance")
    .eq("user_id", userId)
    .gte("start_date", thirtyDaysAgo);

  return {
    totalActivities: allActivities?.length || 0,
    totalDistance: allActivities?.reduce((sum, a) => sum + a.distance, 0) || 0,
    last30Days: {
      activities: recentActivities?.length || 0,
      distance: recentActivities?.reduce((sum, a) => sum + a.distance, 0) || 0,
    },
  };
}
