"use client";

import { useState } from "react";
import { format } from "date-fns";
import { RotateCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusIndicator } from "./status-indicator";
import { ReplaceDialog } from "./replace-dialog";
import { deleteComponentAction } from "@/app/actions/components";
import {
  calculateComponentWear,
  formatDistance,
} from "@/lib/wear/calculator";
import type { Component } from "@/lib/supabase/types";

interface ComponentCardProps {
  component: Component;
}

export function ComponentCard({ component }: ComponentCardProps) {
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const wear = calculateComponentWear(component);
  const cappedPercentage = Math.min(wear.percentage, 100);
  const isCustom = component.type === "custom";

  // Show "Replaced" if installed_at differs from created_at (manual replacement)
  const installed = new Date(component.installed_at).getTime();
  const created = new Date(component.created_at).getTime();
  const wasReplaced = Math.abs(installed - created) >= 60_000;
  const installedLabel = wasReplaced ? "Replaced" : "Installed";
  const installedDate = format(new Date(component.installed_at), "d MMM yyyy");

  const indicatorColor =
    wear.status === "critical"
      ? "bg-status-critical"
      : wear.status === "warning"
        ? "bg-status-warning"
        : "bg-status-healthy";

  async function handleDelete() {
    setDeleting(true);
    try {
      const result = await deleteComponentAction(component.id);
      if (result.success) {
        toast.success(`${component.name} removed`);
      } else {
        toast.error("Failed to delete component", {
          description: result.error,
        });
      }
    } catch {
      toast.error("Failed to delete component", {
        description: "An unexpected error occurred",
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 min-w-0">
              <h4 className="text-sm font-medium truncate">{component.name}</h4>
              {isCustom && (
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  Custom
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <StatusIndicator status={wear.status} isOverdue={wear.isOverdue} />
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setReplaceOpen(true)}
                title="Replace component"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </Button>
              {isCustom && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                  title="Delete component"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          <Progress
            value={cappedPercentage}
            className="h-2 mb-3"
            indicatorClassName={indicatorColor}
          />

          <div className="mb-2">
            <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
              {installedLabel}: {installedDate}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {formatDistance(component.current_distance)} /{" "}
              {formatDistance(component.recommended_distance)}
            </span>
            <span>
              {wear.isOverdue
                ? "Replace now"
                : `${formatDistance(wear.remainingDistance)} left`}
            </span>
          </div>
        </CardContent>
      </Card>

      <ReplaceDialog
        componentId={component.id}
        componentName={component.name}
        open={replaceOpen}
        onOpenChange={setReplaceOpen}
      />
    </>
  );
}
