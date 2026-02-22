"use client";

import { useEffect, useState } from "react";
import { useBikeStore } from "@/lib/stores/bike-store";
import { BikeDetail } from "./bike-detail";
import { BikeSvg } from "./bike-svg";
import { AddComponentDialog } from "./add-component-dialog";
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
  const [configOpen, setConfigOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [preselectedType, setPreselectedType] = useState<string | null>(null);

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

  function handleGhostClick(type: string) {
    setPreselectedType(type);
    setAddDialogOpen(true);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-6 min-h-0">
      {/* SVG panel */}
      {selectedBike && (
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="aspect-[5/3] w-full bg-card rounded-lg border p-4 flex items-center justify-center">
            <BikeSvg
              bike={selectedBike}
              onAddComponent={handleGhostClick}
              onOpenConfig={() => setConfigOpen(true)}
            />
          </div>
        </div>
      )}

      {/* Component panel */}
      {selectedBike && (
        <div className="min-w-0">
          <BikeDetail
            bike={selectedBike}
            typesWithHistory={typesWithHistory}
            lastSync={stats.lastSync}
            configOpen={configOpen}
            onConfigOpenChange={setConfigOpen}
            onOpenConfig={() => setConfigOpen(true)}
          />
        </div>
      )}

      {/* Add component dialog — controlled from ghost hotspot clicks */}
      {selectedBike && (
        <AddComponentDialog
          bikeId={selectedBike.id}
          bike={selectedBike}
          open={addDialogOpen}
          onOpenChange={(open) => {
            setAddDialogOpen(open);
            if (!open) setPreselectedType(null);
          }}
          preselectedType={preselectedType}
        />
      )}
    </div>
  );
}
