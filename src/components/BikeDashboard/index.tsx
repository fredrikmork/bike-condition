"use client";

import { useState } from "react";
import { Bike } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SelectedBike } from "@/components/selectedBike";
import { formatDistance } from "@/lib/wear/calculator";
import { cn } from "@/lib/utils";
import type { BikeWithComponents } from "@/lib/supabase/types";

interface Props {
  bikes: BikeWithComponents[];
}

export function BikeDashboard({ bikes }: Props) {
  const sortedBikes = bikes.toSorted(
    (a, b) => b.total_distance - a.total_distance
  );
  const defaultBikeId =
    bikes.find((b) => b.is_primary)?.id ?? sortedBikes[0]?.id;
  const [selectedBikeId, setSelectedBikeId] = useState<string | undefined>(
    defaultBikeId
  );

  const selectedBike = bikes.find((b) => b.id === selectedBikeId) ?? sortedBikes[0];

  return (
    <div className="space-y-6">
      {/* Bike selector row */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {sortedBikes.map((bike) => {
          const isSelected = bike.id === selectedBike.id;
          return (
            <Card
              key={bike.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedBikeId(bike.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedBikeId(bike.id);
                }
              }}
              className={cn(
                "flex-shrink-0 cursor-pointer transition-colors border-2 px-4 py-3",
                isSelected
                  ? "border-primary-strava bg-dark-grey-3"
                  : "border-transparent bg-dark-grey-4 hover:bg-dark-grey-3"
              )}
            >
              <div className="flex items-center gap-3 text-white">
                <Bike className="h-5 w-5 text-muted-foreground" />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm whitespace-nowrap">
                      {bike.name}
                    </span>
                    {bike.is_primary && (
                      <Badge className="bg-primary-strava hover:bg-primary-strava text-white text-[10px] px-1.5 py-0">
                        Primary
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistance(bike.total_distance)}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Selected bike detail */}
      <SelectedBike bike={selectedBike} />
    </div>
  );
}
