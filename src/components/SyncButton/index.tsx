"use client";

import { useState } from "react";
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
    } catch (error) {
      setLastResult({
        success: false,
        errors: [error instanceof Error ? error.message : "Sync failed"],
      });
      setShowResult(true);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleSync}
        disabled={isSyncing}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium
          transition-all duration-200
          ${isSyncing
            ? "bg-gray-600 cursor-not-allowed"
            : "bg-primary-strava hover:bg-orange-600"
          }
          text-white
        `}
      >
        <SyncIcon spinning={isSyncing} />
        {isSyncing ? "Syncing..." : "Sync with Strava"}
      </button>

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

function SyncIcon({ spinning = false }: { spinning?: boolean }) {
  return (
    <svg
      className={`w-4 h-4 ${spinning ? "animate-spin" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}
