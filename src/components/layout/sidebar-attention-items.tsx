"use client";

import { AlertTriangle } from "lucide-react";
import { useBikeStore } from "@/lib/stores/bike-store";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { calculateComponentWear } from "@/lib/wear/calculator";
import { getBikeConfig, isComponentVisible } from "@/lib/components/visibility";
import type { BikeWithComponents } from "@/lib/supabase/types";

interface AttentionItem {
  bikeId: string;
  bikeName: string;
  componentId: string;
  componentName: string;
  status: "warning" | "critical";
}

interface SidebarAttentionItemsProps {
  bikes: BikeWithComponents[];
}

export function SidebarAttentionItems({ bikes }: SidebarAttentionItemsProps) {
  const { setSelectedBikeId } = useBikeStore();

  const items: AttentionItem[] = bikes.flatMap((bike) => {
    const config = getBikeConfig(bike);
    return bike.components
      .filter((c) => isComponentVisible(c.type, config))
      .flatMap((c) => {
        const wear = calculateComponentWear(c);
        if (wear.status !== "warning" && wear.status !== "critical") return [];
        return [
          {
            bikeId: bike.id,
            bikeName: bike.name,
            componentId: c.id,
            componentName: c.name,
            status: wear.status,
          },
        ];
      });
  });

  if (items.length === 0) return null;

  const multipleBikes = bikes.length > 1;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Needs Attention</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.componentId}>
              <SidebarMenuButton
                onClick={() => setSelectedBikeId(item.bikeId)}
                tooltip={
                  multipleBikes
                    ? `${item.componentName} — ${item.bikeName}`
                    : item.componentName
                }
                className={
                  item.status === "critical"
                    ? "text-status-critical hover:text-status-critical"
                    : "text-status-warning hover:text-status-warning"
                }
              >
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm leading-tight">
                    {item.componentName}
                  </span>
                  {multipleBikes && (
                    <span className="truncate text-xs leading-tight opacity-60">
                      {item.bikeName}
                    </span>
                  )}
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
