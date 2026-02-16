"use server";

import { auth } from "@/lib/auth/config";
import { syncBikes } from "@/lib/sync/bikes";
import { syncActivities } from "@/lib/sync/activities";
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

export async function syncStravaData(fullSync = false): Promise<SyncResult> {
  const session = await auth();

  if (!session?.userId) {
    return {
      success: false,
      errors: ["Not authenticated"],
    };
  }

  const errors: string[] = [];

  // Sync activities first so component distance calculation has fresh data
  const activityResult = await syncActivities(session.userId, { fullSync });
  errors.push(...activityResult.errors);

  // Sync bikes (updates component distances using activity data + gear fallback)
  const bikeResult = await syncBikes(session.userId);
  errors.push(...bikeResult.errors);

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
