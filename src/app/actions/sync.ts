"use server";

import { auth } from "@/lib/auth/config";
import { syncBikes } from "@/lib/sync/bikes";
import { syncActivities } from "@/lib/sync/activities";
import {
  getBikesWithComponents,
  recalculateComponentDistances,
} from "@/lib/db/queries";
import { revalidatePath } from "next/cache";

export interface SyncResult {
  success: boolean;
  bikes?: {
    synced: number;
    created: number;
    updated: number;
  };
  activities?: {
    synced: number;
    skipped: number;
  };
  errors?: string[];
}

export async function syncStravaData(): Promise<SyncResult> {
  const session = await auth();

  if (!session?.userId) {
    return {
      success: false,
      errors: ["Not authenticated"],
    };
  }

  const errors: string[] = [];

  // Sync bikes first
  const bikeResult = await syncBikes(session.userId);
  errors.push(...bikeResult.errors);

  // Check if any bikes have components stuck at 0 km — triggers full activity resync
  const bikesWithComponents = await getBikesWithComponents(session.userId);
  const needsFullSync = bikesWithComponents.some(
    (bike) =>
      bike.total_distance > 0 &&
      bike.components.some((c) => c.current_distance === 0)
  );

  // Sync activities (full sync if components need distance backfill)
  const activityResult = await syncActivities(session.userId, {
    fullSync: needsFullSync,
  });
  errors.push(...activityResult.errors);

  // Recalculate component distances after full sync
  if (needsFullSync) {
    for (const bike of bikesWithComponents) {
      if (
        bike.total_distance > 0 &&
        bike.components.some((c) => c.current_distance === 0)
      ) {
        await recalculateComponentDistances(bike.id, bike.total_distance);
      }
    }
  }

  // Revalidate the dashboard page
  revalidatePath("/");

  return {
    success: errors.length === 0,
    bikes: {
      synced: bikeResult.synced,
      created: bikeResult.created,
      updated: bikeResult.updated,
    },
    activities: {
      synced: activityResult.synced,
      skipped: activityResult.skipped,
    },
    errors: errors.length > 0 ? errors : undefined,
  };
}
