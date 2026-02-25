"use client";

import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import {
  MoreHorizontal,
  PauseCircle,
  Pencil,
  RotateCw,
  Trash2,
  History,
  ChevronDown,
  RefreshCw,
  BellOff,
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { deleteComponentAction, muteComponentAction } from "@/app/actions/components";
import {
  calculateComponentWear,
  formatDistance,
  LUBE_LABELS,
} from "@/lib/wear/calculator";
import { cn } from "@/lib/utils";
import { useBikeStore } from "@/lib/stores/bike-store";
import type { Component, LubeType } from "@/lib/supabase/types";

interface ComponentCardProps {
  component: Component;
  hasHistory?: boolean;
  lastSync?: string | null;
  /** Override the name shown on the card face (dialogs still use component.name) */
  displayName?: string;
  /** True when the bike is currently in a trainer period — distance from virtual rides is paused */
  trainerActive?: boolean;
}

export function ComponentCard({ component, hasHistory = false, lastSync, displayName, trainerActive = false }: ComponentCardProps) {
  const { focusedComponentId, setFocusedComponentId } = useBikeStore();
  const focused = focusedComponentId === component.id;
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!focused) return;
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    const timer = setTimeout(() => setFocusedComponentId(null), 3000);
    return () => clearTimeout(timer);
  }, [focused, setFocusedComponentId]);

  const [expanded, setExpanded] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [muting, setMuting] = useState(false);

  async function handleMute() {
    setMuting(true);
    try {
      const result = await muteComponentAction(component.id, true);
      if (!result.success) {
        toast.error("Failed to mute component", { description: result.error });
      }
    } catch {
      toast.error("Failed to mute component");
    } finally {
      setMuting(false);
    }
  }

  const wear = calculateComponentWear(component);
  const cappedPercentage = Math.min(wear.percentage, 100);
  const isCustom = component.type === "custom";

  const installed = new Date(component.installed_at).getTime();
  const created = new Date(component.created_at).getTime();
  const wasReplaced = Math.abs(installed - created) >= 60_000;
  const installedLabel = wasReplaced ? "Replaced" : "Tracking since";
  const installedDate = format(new Date(component.installed_at), "d MMM yyyy");

  // True when the component was installed after the last sync — distances are stale
  const needsSync = lastSync
    ? new Date(component.installed_at) > new Date(lastSync)
    : false;

  const indicatorColor = trainerActive
    ? "bg-muted-foreground/40"
    : wear.status === "critical"
      ? "bg-status-critical"
      : wear.status === "warning"
        ? "bg-status-warning"
        : "bg-status-healthy";

  // Brand/model/spec → shown on card face
  const hasFaceInfo = !!(component.brand || component.model || component.spec);

  // Lube/notes → live behind expand
  const canExpand = !!(component.lube_type || component.notes);

  // All metadata null → show ghost CTA
  const isUnedited = !hasFaceInfo && !component.lube_type && !component.notes;

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

  const focusRingClass = focused
    ? wear.status === "critical"
      ? "ring-2 ring-status-critical ring-offset-2 ring-offset-background"
      : wear.status === "warning"
        ? "ring-2 ring-status-warning ring-offset-2 ring-offset-background"
        : "ring-2 ring-primary ring-offset-2 ring-offset-background"
    : "";

  return (
    <>
      <Card ref={cardRef} className={cn("transition-shadow duration-300", focusRingClass)}>
        <CardContent className="p-4">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <h4 className="text-sm font-medium truncate">{displayName ?? component.name}</h4>
              {isCustom && (
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  Custom
                </Badge>
              )}
              {trainerActive && (
                <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground gap-1 shrink-0">
                  <PauseCircle className="h-2.5 w-2.5" />
                  Trainer
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
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuItem onClick={() => setEditOpen(true)}>
                        <Pencil className="mr-2 h-3.5 w-3.5" />
                        Edit
                      </DropdownMenuItem>
                    </TooltipTrigger>
                    <TooltipContent side="right">Update brand, model and notes</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuItem onClick={() => setReplaceOpen(true)}>
                        <RotateCw className="mr-2 h-3.5 w-3.5" />
                        Replace
                      </DropdownMenuItem>
                    </TooltipTrigger>
                    <TooltipContent side="right">Log a replacement and reset wear</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuItem onClick={handleMute} disabled={muting}>
                        <BellOff className="mr-2 h-3.5 w-3.5" />
                        Mute
                      </DropdownMenuItem>
                    </TooltipTrigger>
                    <TooltipContent side="right">Hide wear alerts for this component</TooltipContent>
                  </Tooltip>
                  {hasHistory && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuItem onClick={() => setHistoryOpen(true)}>
                          <History className="mr-2 h-3.5 w-3.5" />
                          View history
                        </DropdownMenuItem>
                      </TooltipTrigger>
                      <TooltipContent side="right">See past replacements</TooltipContent>
                    </Tooltip>
                  )}
                  <DropdownMenuSeparator />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteDialogOpen(true)}
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </TooltipTrigger>
                    <TooltipContent side="right">Remove this component from tracking</TooltipContent>
                  </Tooltip>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Subtitle: brand/model text + spec chip, or unedited ghost CTA */}
          {(hasFaceInfo || isUnedited) && (
            <div className="flex items-center gap-1.5 min-w-0 mt-0.5 mb-3">
              {(component.brand || component.model) && (
                <span className="text-xs text-muted-foreground truncate">
                  {[component.brand, component.model].filter(Boolean).join(" ")}
                </span>
              )}
              {component.spec && (
                <Badge variant="outline" className="text-[10px] font-normal shrink-0">
                  {component.spec}
                </Badge>
              )}
              {isUnedited && (
                <button
                  onClick={() => setEditOpen(true)}
                  className="flex cursor-pointer items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                  aria-label="Add component details"
                >
                  <Pencil className="h-3 w-3" />
                  Add details
                </button>
              )}
            </div>
          )}

          {/* Wear bar */}
          <Progress
            value={cappedPercentage}
            className={cn("h-2 mb-3", !hasFaceInfo && !isUnedited && "mt-3")}
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
          <div
            className={cn(
              "flex items-center justify-between text-xs text-muted-foreground",
              canExpand && "cursor-pointer select-none"
            )}
            role={canExpand ? "button" : undefined}
            aria-expanded={canExpand ? expanded : undefined}
            aria-label={canExpand ? (expanded ? "Collapse details" : "Expand details") : undefined}
            tabIndex={canExpand ? 0 : undefined}
            onClick={canExpand ? () => setExpanded((v) => !v) : undefined}
            onKeyDown={canExpand ? (e) => { if (e.key === "Enter" || e.key === " ") setExpanded((v) => !v); } : undefined}
          >
            <span>
              {formatDistance(component.current_distance ?? 0)} /{" "}
              {formatDistance(component.recommended_distance)}
            </span>
            <div className="flex items-center gap-2">
              <span>
                {needsSync ? (
                  <span className="flex items-center gap-1 text-muted-foreground/70">
                    <RefreshCw aria-hidden="true" className="h-3 w-3" />
                    Sync to update
                  </span>
                ) : wear.isOverdue ? (
                  "Replace now"
                ) : (
                  `${formatDistance(wear.remainingDistance)} left`
                )}
              </span>
              {canExpand && (
                <span aria-hidden="true" className="flex items-center text-muted-foreground/60">
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform duration-200",
                      expanded && "rotate-180"
                    )}
                  />
                </span>
              )}
            </div>
          </div>

          {/* Expanded metadata: lube chip + notes */}
          {canExpand && expanded && (
            <div className="mt-3 pt-3 border-t space-y-2">
              {component.lube_type && (
                <Badge variant="secondary" className="text-[10px]">
                  {LUBE_LABELS[component.lube_type as LubeType]}
                </Badge>
              )}
              {component.notes && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {component.notes}
                </p>
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
