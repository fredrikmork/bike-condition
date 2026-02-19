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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { syncStravaData } from "@/app/actions/sync";
import { cn } from "@/lib/utils";

interface SyncButtonProps {
  variant?: "sidebar" | "default";
  lastSynced?: string | null;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function SyncButton({ variant = "sidebar", lastSynced }: SyncButtonProps) {
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
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarMenuButton
              onClick={handleSync}
              disabled={syncing}
              tooltip="Sync Strava"
            >
              <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
              <span>{syncing ? "Syncing..." : "Sync Strava"}</span>
            </SidebarMenuButton>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-56">
            Pulls your latest rides and bikes from Strava and updates component wear distances. Run this after every ride to keep wear data accurate.
          </TooltipContent>
        </Tooltip>
        <p className="px-2 pt-0.5 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          {syncing
            ? "Fetching rides & bikes…"
            : lastSynced
              ? `Last synced ${formatRelativeTime(lastSynced)}`
              : "Never synced — run after a ride"}
        </p>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
