"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
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
  const session = await getServerSession(authOptions);

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

  // Then sync activities
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

export async function syncBikesOnly(): Promise<SyncResult> {
  const session = await getServerSession(authOptions);

  if (!session?.userId) {
    return {
      success: false,
      errors: ["Not authenticated"],
    };
  }

  const result = await syncBikes(session.userId);

  revalidatePath("/");

  return {
    success: result.errors.length === 0,
    bikes: {
      synced: result.synced,
      created: result.created,
      updated: result.updated,
    },
    errors: result.errors.length > 0 ? result.errors : undefined,
  };
}

export async function syncActivitiesOnly(): Promise<SyncResult> {
  const session = await getServerSession(authOptions);

  if (!session?.userId) {
    return {
      success: false,
      errors: ["Not authenticated"],
    };
  }

  const result = await syncActivities(session.userId);

  revalidatePath("/");

  return {
    success: result.errors.length === 0,
    activities: {
      synced: result.synced,
      skipped: result.skipped,
    },
    errors: result.errors.length > 0 ? result.errors : undefined,
  };
}
