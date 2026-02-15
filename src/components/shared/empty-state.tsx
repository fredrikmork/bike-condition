"use client";

import { Bike } from "lucide-react";
import { SyncButton } from "./sync-button";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <Bike className="h-10 w-10 text-muted-foreground" />
      </div>
      <div className="text-center max-w-md">
        <h2 className="text-xl font-semibold mb-2">No bikes yet</h2>
        <p className="text-muted-foreground mb-6">
          Sync with Strava to import your bikes and start tracking component
          wear.
        </p>
        <SyncButton variant="default" />
      </div>
    </div>
  );
}
