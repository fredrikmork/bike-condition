"use client";

import { AlertTriangle, ChevronDown } from "lucide-react";
import { useState } from "react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { getBikeConfig, isComponentVisible } from "@/lib/components/visibility";
import { useBikeStore } from "@/lib/stores/bike-store";
import type { BikeWithComponents } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { calculateComponentWear } from "@/lib/wear/calculator";

const INITIAL_VISIBLE = 3;

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
  const { setSelectedBikeId, setFocusedComponentId } = useBikeStore();
  const { setOpenMobile } = useSidebar();
  const [expanded, setExpanded] = useState(false);

  const items: AttentionItem[] = bikes.flatMap((bike) => {
    const config = getBikeConfig(bike);
    return bike.components
      .filter((c) => !c.muted && isComponentVisible(c.type, config))
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
  const hidden = items.length - INITIAL_VISIBLE;
  const visible = expanded ? items : items.slice(0, INITIAL_VISIBLE);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Needs Attention</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {visible.map((item) => (
            <SidebarMenuItem key={item.componentId}>
              <SidebarMenuButton
                onClick={() => {
                  setSelectedBikeId(item.bikeId);
                  setFocusedComponentId(item.componentId);
                  setOpenMobile(false);
                }}
                tooltip={
                  multipleBikes ? `${item.componentName} — ${item.bikeName}` : item.componentName
                }
                className={
                  item.status === "critical"
                    ? "text-status-critical hover:text-status-critical"
                    : "text-status-warning hover:text-status-warning"
                }
              >
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm leading-tight">{item.componentName}</span>
                  {multipleBikes && (
                    <span className="truncate text-xs leading-tight opacity-60">
                      {item.bikeName}
                    </span>
                  )}
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}

          {hidden > 0 && (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setExpanded((v) => !v)}
                className="text-muted-foreground hover:text-foreground group-data-[collapsible=icon]:hidden"
                tooltip={expanded ? "Show less" : `${hidden} more`}
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-200",
                    expanded && "rotate-180"
                  )}
                />
                <span className="text-xs">{expanded ? "Show less" : `${hidden} more`}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
