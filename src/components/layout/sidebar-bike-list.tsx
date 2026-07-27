"use client";

import { AlertTriangle, Archive, Settings2 } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { isContainerType } from "@/lib/components/containers";
import { getBikeTypeIcon } from "@/lib/components/icons";
import { useBikeStore } from "@/lib/stores/bike-store";
import type { BikeWithComponents } from "@/lib/supabase/types";
import { calculateComponentWear } from "@/lib/wear/calculator";

interface SidebarBikeListProps {
  bikes: BikeWithComponents[];
  /** Retired bikes — no config/warning badges, muted styling */
  readOnly?: boolean;
}

export function SidebarBikeList({ bikes, readOnly = false }: SidebarBikeListProps) {
  const { selectedBikeId, setSelectedBikeId } = useBikeStore();
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarMenu>
      {bikes.map((bike) => {
        const BikeTypeIcon = getBikeTypeIcon(bike.bike_type, bike.frame_type);
        const hasWarning = bike.components.some((c) => {
          if (isContainerType(c.type)) return false; // wheels carry no wear of their own
          const wear = calculateComponentWear(c);
          return wear.status === "warning" || wear.status === "critical";
        });

        return (
          <SidebarMenuItem key={bike.id}>
            <SidebarMenuButton
              isActive={selectedBikeId === bike.id}
              onClick={() => {
                setSelectedBikeId(bike.id);
                setOpenMobile(false);
              }}
              tooltip={readOnly ? `${bike.name} (retired)` : bike.name}
              className={readOnly ? "text-muted-foreground" : undefined}
            >
              {readOnly ? <Archive className="h-4 w-4" /> : <BikeTypeIcon className="h-4 w-4" />}
              <span className="truncate">{bike.name}</span>
            </SidebarMenuButton>
            {!readOnly && !bike.config_complete && (
              <SidebarMenuBadge>
                <Settings2 className="h-3 w-3 text-muted-foreground" />
              </SidebarMenuBadge>
            )}
            {!readOnly && bike.config_complete && hasWarning && (
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
