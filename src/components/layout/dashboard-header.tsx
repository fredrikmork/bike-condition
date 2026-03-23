"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, RefreshCw } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EmailSettingsDialog } from "./email-settings-dialog";
import { getUserEmail } from "@/app/actions/user";
import { useSyncStrava } from "@/hooks/use-sync-strava";
import { cn } from "@/lib/utils";

export function DashboardHeader() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const { syncing, handleSync } = useSyncStrava();

  useEffect(() => {
    getUserEmail().then(setCurrentEmail);
  }, []);

  const hasEmail = !!currentEmail;

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <h1 className="text-sm font-medium">Dashboard</h1>
      <div className="ml-auto flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSync}
              disabled={syncing}
            >
              <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="max-w-64">
            Strava automatically triggers a sync after each ride. Use this manually if something looks off or after editing a component.
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDialogOpen(true)}
              className="relative"
            >
              {hasEmail ? (
                <Bell className="h-4 w-4" />
              ) : (
                <BellOff className="h-4 w-4 text-muted-foreground" />
              )}
              {!hasEmail && (
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {hasEmail ? `Varsler: ${currentEmail}` : "Sett opp e-postvarsler"}
          </TooltipContent>
        </Tooltip>
        <ThemeToggle />
      </div>
      <EmailSettingsDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) getUserEmail().then(setCurrentEmail);
        }}
        currentEmail={currentEmail}
      />
    </header>
  );
}
