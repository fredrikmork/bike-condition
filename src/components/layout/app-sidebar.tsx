"use client";

import { Bike, Github } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SidebarBikeList } from "./sidebar-bike-list";
import { SidebarUserMenu } from "./sidebar-user-menu";
import { SidebarAttentionItems } from "./sidebar-attention-items";
import { SyncButton } from "@/components/shared/sync-button";
import { formatDistance } from "@/lib/wear/calculator";
import type { BikeWithComponents } from "@/lib/supabase/types";

interface AppSidebarProps {
  bikes: BikeWithComponents[];
  lastSynced?: string | null;
}

export function AppSidebar({ bikes, lastSynced }: AppSidebarProps) {
  const totalDistance = bikes.reduce((sum, b) => sum + (b.total_distance ?? 0), 0);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Bike className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Bike Condition</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Wear Tracking
                  </span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            Bikes ({bikes.length})
          </SidebarGroupLabel>
          <p className="px-2 pb-2 text-xs text-muted-foreground/60 group-data-[collapsible=icon]:hidden">
            The correct number of bikes is n+1.
            You currently have n&nbsp;=&nbsp;{bikes.length}.
          </p>
          <SidebarGroupContent>
            <SidebarBikeList bikes={bikes} />
            <p className="px-2 pt-1 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
              {formatDistance(totalDistance)} total
            </p>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SyncButton lastSynced={lastSynced} />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarAttentionItems bikes={bikes} />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Report a bug or suggest something"
              className="text-muted-foreground hover:text-foreground"
            >
              <a
                href="https://github.com/fredrikmork/bike-condition/issues"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-4 w-4 shrink-0" />
                <span>Something off? Let us know!</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarUserMenu />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
