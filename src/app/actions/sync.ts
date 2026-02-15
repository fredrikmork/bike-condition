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

export async function syncStravaData(): Promise<SyncResult> {
  const session = await auth();

  if (!session?.userId) {
    return {
      success: false,
      errors: ["Not authenticated"],
    };
  }

  const errors: string[] = [];

  // Sync bikes (also updates component distances via authoritative formula)
  const bikeResult = await syncBikes(session.userId);
  errors.push(...bikeResult.errors);

  // Sync activities
  const activityResult = await syncActivities(session.userId);
  errors.push(...activityResult.errors);

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
