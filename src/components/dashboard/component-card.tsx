"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  MoreHorizontal,
  Pencil,
  RotateCw,
  Trash2,
  History,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StatusIndicator } from "./status-indicator";
import { ReplaceDialog } from "./replace-dialog";
import { EditComponentDialog } from "./edit-component-dialog";
import { ComponentHistorySheet } from "./component-history-sheet";
import { deleteComponentAction } from "@/app/actions/components";
import { getComponentIcon } from "@/lib/components/icons";
import {
  calculateComponentWear,
  formatDistance,
  LUBE_LABELS,
} from "@/lib/wear/calculator";
import { cn } from "@/lib/utils";
import type { Component, LubeType } from "@/lib/supabase/types";

interface ComponentCardProps {
  component: Component;
  hasHistory?: boolean;
}

export function ComponentCard({ component, hasHistory = false }: ComponentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const wear = calculateComponentWear(component);
  const cappedPercentage = Math.min(wear.percentage, 100);
  const isCustom = component.type === "custom";
  const Icon = getComponentIcon(component.type, component.icon);

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

  // Determine if there's any metadata worth showing
  const hasMetadata = !!(
    component.brand ||
    component.model ||
    component.spec ||
    component.lube_type ||
    component.notes
  );

  async function handleDelete() {
    setDeleting(true);
    try {
      const result = await deleteComponentAction(component.id);
      if (result.success) {
        toast.success(`${component.name} removed`);
      } else {
        toast.error("Failed to delete component", { description: result.error });
      }
    } catch {
      toast.error("Failed to delete component", {
        description: "An unexpected error occurred",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  }

  return (
    <>
      <Card>
        <CardContent className="p-4">
          {/* Header row */}
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    aria-label="Component actions"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditOpen(true)}>
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setReplaceOpen(true)}>
                    <RotateCw className="mr-2 h-3.5 w-3.5" />
                    Replace
                  </DropdownMenuItem>
                  {hasHistory && (
                    <DropdownMenuItem onClick={() => setHistoryOpen(true)}>
                      <History className="mr-2 h-3.5 w-3.5" />
                      View history
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Wear bar */}
          <Progress
            value={cappedPercentage}
            className="h-2 mb-3"
            indicatorClassName={indicatorColor}
          />

          {/* Install date */}
          <div className="mb-2">
            <Badge
              variant="outline"
              className="text-[10px] font-normal text-muted-foreground"
            >
              {installedLabel}: {installedDate}
            </Badge>
          </div>

          {/* Distance row + expand toggle */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {formatDistance(component.current_distance)} /{" "}
              {formatDistance(component.recommended_distance)}
            </span>
            <div className="flex items-center gap-2">
              <span>
                {wear.isOverdue
                  ? "Replace now"
                  : `${formatDistance(wear.remainingDistance)} left`}
              </span>
              {hasMetadata && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="flex items-center text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                  aria-label={expanded ? "Collapse details" : "Expand details"}
                >
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform duration-200",
                      expanded && "rotate-180"
                    )}
                  />
                </button>
              )}
            </div>
          </div>

          {/* Expanded metadata */}
          {expanded && hasMetadata && (
            <div className="mt-3 pt-3 border-t grid gap-1.5">
              {(component.brand || component.model) && (
                <MetaRow
                  label="Brand / Model"
                  value={[component.brand, component.model].filter(Boolean).join(" ")}
                />
              )}
              {component.spec && (
                <MetaRow label="Spec" value={component.spec} />
              )}
              {component.lube_type && (
                <MetaRow
                  label="Lube"
                  value={LUBE_LABELS[component.lube_type as LubeType]}
                />
              )}
              {component.notes && (
                <MetaRow label="Notes" value={component.notes} />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs — rendered outside the DropdownMenu tree */}
      <EditComponentDialog
        component={component}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <ReplaceDialog
        componentId={component.id}
        componentName={component.name}
        open={replaceOpen}
        onOpenChange={setReplaceOpen}
      />

      {hasHistory && (
        <ComponentHistorySheet
          bikeId={component.bike_id}
          componentType={component.type}
          componentName={component.name}
          open={historyOpen}
          onOpenChange={setHistoryOpen}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {component.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will stop tracking {component.name} on this bike.
              {!isCustom && " It won't be re-added on the next sync."}
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
    </>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-xs">
      <span className="text-muted-foreground/60 w-20 shrink-0">{label}</span>
      <span className="text-muted-foreground">{value}</span>
    </div>
  );
}
