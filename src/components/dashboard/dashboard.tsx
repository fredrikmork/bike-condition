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
}

export function Dashboard({ bikes, stats }: DashboardProps) {
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

  return (
    <div className="space-y-6">
      <StatsCards stats={stats} />
      {selectedBike && <BikeDetail bike={selectedBike} />}
    </div>
  );
}
