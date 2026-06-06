"use client";

import { useEffect } from "react";
import { useBikeStore } from "@/lib/stores/bike-store";
import type { BikeWithComponents } from "@/lib/supabase/types";
import { BikeDetail } from "./bike-detail";

interface DashboardProps {
  bikes: BikeWithComponents[];
  lastSync: string | null;
  historyByBike: Record<string, string[]>;
  virtualKmByBike: Record<string, number>;
}

export function Dashboard({ bikes, lastSync, historyByBike, virtualKmByBike }: DashboardProps) {
  const { selectedBikeId, setSelectedBikeId } = useBikeStore();

  // Initialize with primary or most-ridden bike
  useEffect(() => {
    if (selectedBikeId && bikes.some((b) => b.id === selectedBikeId)) return;
    if (bikes.length === 0) return;

    // Prefer a real-ride bike over virtual-only bikes
    const rideBike = bikes.find((b) => b.default_sport_type === "Ride");
    const primary = bikes.find((b) => b.is_primary);
    const fallback = bikes[0]; // Already sorted by distance desc from query
    setSelectedBikeId((rideBike ?? primary ?? fallback).id);
  }, [bikes, selectedBikeId, setSelectedBikeId]);

  const selectedBike = bikes.find((b) => b.id === selectedBikeId);
  const typesWithHistory = new Set(selectedBike ? (historyByBike[selectedBike.id] ?? []) : []);

  return (
    <>
      {selectedBike && (
        <BikeDetail
          bike={selectedBike}
          typesWithHistory={typesWithHistory}
          lastSync={lastSync}
          virtualKm={virtualKmByBike[selectedBike.id] ?? 0}
        />
      )}
    </>
  );
}
