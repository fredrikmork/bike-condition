"use client";

import { useState } from "react";
import { toast } from "sonner";
import { syncStravaData } from "@/app/actions/sync";

export function useSyncStrava() {
  const [syncing, setSyncing] = useState(false);

  async function handleSync() {
    setSyncing(true);
    try {
      const result = await syncStravaData();
      if (result.success) {
        toast.success("Sync complete", {
          description: `${result.bikes?.synced ?? 0} bikes, ${result.activities?.synced ?? 0} activities`,
        });
      } else {
        toast.error("Sync failed", {
          description: result.errors?.[0] ?? "Unknown error",
        });
      }
    } catch {
      toast.error("Sync failed", {
        description: "An unexpected error occurred",
      });
    } finally {
      setSyncing(false);
    }
  }

  return { syncing, handleSync };
}
