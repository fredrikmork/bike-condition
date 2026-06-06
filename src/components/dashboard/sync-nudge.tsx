"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSyncStrava } from "@/hooks/use-sync-strava";
import { cn } from "@/lib/utils";

interface SyncNudgeProps {
  count: number;
}

export function SyncNudge({ count }: SyncNudgeProps) {
  const { syncing, handleSync } = useSyncStrava();

  const label =
    count === 1
      ? "A component was changed since your last sync"
      : `${count} components were changed since your last sync`;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed px-3 py-2.5 text-sm">
      <RefreshCw
        className={cn("h-4 w-4 shrink-0 text-muted-foreground", syncing && "animate-spin")}
      />
      <span className="flex-1 text-muted-foreground">{label} — sync to update distances.</span>
      <Button
        size="sm"
        variant="outline"
        onClick={handleSync}
        disabled={syncing}
        className="h-7 shrink-0 text-xs"
      >
        {syncing ? "Syncing…" : "Sync now"}
      </Button>
    </div>
  );
}
