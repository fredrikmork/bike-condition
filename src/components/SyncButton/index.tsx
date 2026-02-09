"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { syncStravaData, type SyncResult } from "@/app/actions/sync";

interface SyncButtonProps {
  className?: string;
}

export function SyncButton({ className = "" }: SyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    setShowResult(false);

    try {
      const result = await syncStravaData();
      setLastResult(result);
      setShowResult(true);

      // Hide result after 5 seconds
      setTimeout(() => setShowResult(false), 5000);
    } catch {
      setLastResult({
        success: false,
        errors: ["Sync failed. Please try again later."],
      });
      setShowResult(true);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        onClick={handleSync}
        disabled={isSyncing}
        className="gap-2 bg-primary-strava hover:bg-orange-600 text-white"
      >
        <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
        {isSyncing ? "Syncing..." : "Sync with Strava"}
      </Button>

      {showResult && lastResult && (
        <div
          className={`
            absolute top-full right-0 mt-2 p-3 rounded-lg text-sm
            min-w-[200px] shadow-lg z-10
            ${lastResult.success
              ? "bg-green-900 text-green-100"
              : "bg-red-900 text-red-100"
            }
          `}
        >
          {lastResult.success ? (
            <div className="space-y-1">
              {lastResult.bikes && (
                <p>
                  Bikes: {lastResult.bikes.synced} synced
                  {lastResult.bikes.created > 0 && ` (${lastResult.bikes.created} new)`}
                </p>
              )}
              {lastResult.activities && (
                <p>Activities: {lastResult.activities.synced} synced</p>
              )}
            </div>
          ) : (
            <div>
              <p className="font-medium">Sync failed</p>
              {lastResult.errors?.map((error, i) => (
                <p key={i} className="text-xs mt-1 opacity-80">
                  {error}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
