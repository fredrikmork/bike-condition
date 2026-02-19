"use client";

import { useEffect } from "react";
import { useBikeStore } from "@/lib/stores/bike-store";
import { StatsCards } from "./stats-cards";
import { BikeDetail } from "./bike-detail";
import type { BikeWithComponents } from "@/lib/supabase/types";

interface DashboardProps {
  bikes: BikeWithComponents[];
  stats: {
    totalBikes: number;
    totalDistance: number;
    componentsNeedingAttention: number;
    lastSync: string | null;
  };
  historyByBike: Record<string, string[]>;
}

export function Dashboard({ bikes, stats, historyByBike }: DashboardProps) {
  const { selectedBikeId, setSelectedBikeId } = useBikeStore();

  // Initialize with primary or most-ridden bike
  useEffect(() => {
    if (selectedBikeId && bikes.some((b) => b.id === selectedBikeId)) return;
    if (bikes.length === 0) return;

    const primary = bikes.find((b) => b.is_primary);
    const fallback = bikes[0]; // Already sorted by distance desc from query
    setSelectedBikeId((primary ?? fallback).id);
  }, [bikes, selectedBikeId, setSelectedBikeId]);

  const selectedBike = bikes.find((b) => b.id === selectedBikeId);
  const typesWithHistory = new Set(selectedBike ? (historyByBike[selectedBike.id] ?? []) : []);

  return (
    <div className="space-y-6">
      <StatsCards stats={stats} />
      {selectedBike && <BikeDetail bike={selectedBike} typesWithHistory={typesWithHistory} lastSync={stats.lastSync} />}
    </div>
  );
}
