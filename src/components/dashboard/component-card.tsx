"use client";

import { useState } from "react";
import { format } from "date-fns";
import { RotateCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { StatusIndicator } from "./status-indicator";
import { ReplaceDialog } from "./replace-dialog";
import { deleteComponentAction } from "@/app/actions/components";
import { getComponentIcon } from "@/lib/components/icons";
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

  const Icon = getComponentIcon(component.type, component.icon);

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

  const deleteButton = (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 text-muted-foreground hover:text-destructive"
      disabled={deleting}
      title="Delete component"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 min-w-0">
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
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
              {isCustom ? (
                <span onClick={handleDelete}>{deleteButton}</span>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    {deleteButton}
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove {component.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will stop tracking {component.name} on this bike.
                        It won&apos;t be re-added on the next sync.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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
