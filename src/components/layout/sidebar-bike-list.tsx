"use client";

import { AlertTriangle, Bike } from "lucide-react";
import { useBikeStore } from "@/lib/stores/bike-store";
import { calculateComponentWear } from "@/lib/wear/calculator";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import type { BikeWithComponents } from "@/lib/supabase/types";

interface SidebarBikeListProps {
  bikes: BikeWithComponents[];
}

export function SidebarBikeList({ bikes }: SidebarBikeListProps) {
  const { selectedBikeId, setSelectedBikeId } = useBikeStore();

  return (
    <SidebarMenu>
      {bikes.map((bike) => {
        const hasWarning = bike.components.some((c) => {
          const wear = calculateComponentWear(c);
          return wear.status === "warning" || wear.status === "critical";
        });

        return (
          <SidebarMenuItem key={bike.id}>
            <SidebarMenuButton
              isActive={selectedBikeId === bike.id}
              onClick={() => setSelectedBikeId(bike.id)}
              tooltip={bike.name}
            >
              <Bike className="h-4 w-4" />
              <span className="truncate">{bike.name}</span>
            </SidebarMenuButton>
            {hasWarning && (
              <SidebarMenuBadge>
                <AlertTriangle className="h-3 w-3 text-status-warning" />
              </SidebarMenuBadge>
            )}
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
