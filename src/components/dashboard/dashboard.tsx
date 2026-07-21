"use client";

import { useEffect } from "react";
import { useBikeStore } from "@/lib/stores/bike-store";
import type { BikeWithComponents } from "@/lib/supabase/types";
import { BikeDetail } from "./bike-detail";

interface DashboardProps {
  bikes: BikeWithComponents[];
  retiredBikes?: BikeWithComponents[];
  lastSync: string | null;
  historyByBike: Record<string, string[]>;
  virtualKmByBike: Record<string, number>;
}

export function Dashboard({
  bikes,
  retiredBikes = [],
  lastSync,
  historyByBike,
  virtualKmByBike,
}: DashboardProps) {
  const { selectedBikeId, setSelectedBikeId } = useBikeStore();

  // Initialize with the most-ridden bike, preferring a real-ride bike over
  // virtual-only bikes (bikes are already sorted by distance desc from the query).
  // Retired bikes are only selectable from the sidebar, never auto-selected —
  // unless they are all the user has.
  useEffect(() => {
    const selectable = bikes.length > 0 ? bikes : retiredBikes;
    if (selectedBikeId && [...bikes, ...retiredBikes].some((b) => b.id === selectedBikeId)) return;
    if (selectable.length === 0) return;

    const rideBike = selectable.find((b) => b.default_sport_type === "Ride");
    const fallback = selectable[0];
    setSelectedBikeId((rideBike ?? fallback).id);
  }, [bikes, retiredBikes, selectedBikeId, setSelectedBikeId]);

  const selectedBike =
    bikes.find((b) => b.id === selectedBikeId) ?? retiredBikes.find((b) => b.id === selectedBikeId);
  const typesWithHistory = new Set(selectedBike ? (historyByBike[selectedBike.id] ?? []) : []);

  return (
    <>
      {selectedBike && (
        <BikeDetail
          bike={selectedBike}
          typesWithHistory={typesWithHistory}
          lastSync={lastSync}
          virtualKm={virtualKmByBike[selectedBike.id] ?? 0}
          readOnly={selectedBike.retired}
        />
      )}
    </>
  );
}
