"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  SidebarMenuButton,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { syncStravaData } from "@/app/actions/sync";
import { cn } from "@/lib/utils";

interface SyncButtonProps {
  variant?: "sidebar" | "default";
}

export function SyncButton({ variant = "sidebar" }: SyncButtonProps) {
  const [syncing, setSyncing] = useState(false);

  async function handleSync() {
    setSyncing(true);
    try {
      const result = await syncStravaData();
      if (result.success) {
        toast.success("Sync complete", {
          description: `${result.bikes?.synced ?? 0} bikes, ${result.activities?.synced ?? 0} activities`,
        });
      } else {
        toast.error("Sync failed", {
          description: result.errors?.[0] ?? "Unknown error",
        });
      }
    } catch {
      toast.error("Sync failed", {
        description: "An unexpected error occurred",
      });
    } finally {
      setSyncing(false);
    }
  }

  if (variant === "default") {
    return (
      <Button onClick={handleSync} disabled={syncing}>
        <RefreshCw className={cn("mr-2 h-4 w-4", syncing && "animate-spin")} />
        {syncing ? "Syncing..." : "Sync with Strava"}
      </Button>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton onClick={handleSync} disabled={syncing}>
          <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
          <span>{syncing ? "Syncing..." : "Sync Strava"}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
