"use client";

import { format } from "date-fns";
import {
  BellOff,
  ChevronDown,
  History,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  RotateCw,
  Trash2,
} from "lucide-react";
import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteComponentAction,
  muteComponentAction,
  updateComponentAction,
} from "@/app/actions/components";
import { replaceComponentAction } from "@/app/actions/replace";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useBikeStore } from "@/lib/stores/bike-store";
import type { Component, LubeType } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { calculateComponentWear, formatDistance, LUBE_LABELS } from "@/lib/wear/calculator";
import { ComponentHistorySheet } from "./component-history-sheet";
import { EditComponentDialog, type UpdateComponentData } from "./edit-component-dialog";
import { ReplaceDialog } from "./replace-dialog";
import { StatusIndicator } from "./status-indicator";

interface ComponentCardProps {
  component: Component;
  hasHistory?: boolean;
  lastSync?: string | null;
  /** Override the name shown on the card face (dialogs still use component.name) */
  displayName?: string;
  /** True when this component excludes virtual ride km (wheels, brake cables on a trainer bike) */
  outdoorOnly?: boolean;
}

export function ComponentCard({
  component,
  hasHistory = false,
  lastSync,
  displayName,
  outdoorOnly = false,
}: ComponentCardProps) {
  const { focusedComponentId, setFocusedComponentId } = useBikeStore();
  const focused = focusedComponentId === component.id;
  const cardRef = useRef<HTMLDivElement>(null);

  const [, startTransition] = useTransition();
  const [optimisticHidden, setOptimisticHidden] = useOptimistic(false, (_, v: boolean) => v);
  const [optimisticComponent, applyOptimisticUpdate] = useOptimistic(
    component,
    (state: Component, update: Partial<Component>) => ({ ...state, ...update })
  );

  const [expanded, setExpanded] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [notesOverflows, setNotesOverflows] = useState(false);
  const notesRef = useRef<HTMLParagraphElement>(null);
  const [replaceOpen, setReplaceOpen] = useState(false);

  useEffect(() => {
    if (!focused) return;
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    const timer = setTimeout(() => setFocusedComponentId(null), 3000);
    return () => clearTimeout(timer);
  }, [focused, setFocusedComponentId]);

  // Detect whether notes text overflows 2 lines (must run in collapsed state).
  // biome-ignore lint/correctness/useExhaustiveDependencies: notes content drives DOM overflow re-measurement
  useEffect(() => {
    if (notesExpanded || !notesRef.current) return;
    setNotesOverflows(notesRef.current.scrollHeight > notesRef.current.clientHeight);
  }, [component.notes, notesExpanded]);

  const [editOpen, setEditOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  function handleMute() {
    startTransition(async () => {
      setOptimisticHidden(true);
      try {
        const result = await muteComponentAction(component.id, true);
        if (!result.success) {
          toast.error("Failed to mute component", { description: result.error });
        } else {
          toast.success(`${component.name} muted`);
        }
      } catch {
        toast.error("Failed to mute component");
      }
    });
  }

  function handleDelete() {
    setDeleteDialogOpen(false);
    startTransition(async () => {
      setOptimisticHidden(true);
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
      }
    });
  }

  function handleSaveEdit(data: UpdateComponentData) {
    setEditOpen(false);
    startTransition(async () => {
      applyOptimisticUpdate({
        name: data.name,
        brand: data.brand,
        model: data.model,
        spec: data.spec,
        lube_type: data.lube_type,
        recommended_distance: data.recommended_distance,
        notes: data.notes,
      });
      try {
        const result = await updateComponentAction(component.id, data);
        if (result.success) {
          toast.success(`${data.name} updated`);
        } else {
          toast.error("Failed to update component", { description: result.error });
        }
      } catch {
        toast.error("Failed to update component", { description: "An unexpected error occurred" });
      }
    });
  }

  function handleReplace(date: Date) {
    setReplaceOpen(false);
    startTransition(async () => {
      applyOptimisticUpdate({
        current_distance: 0,
        installed_at: date.toISOString(),
      });
      try {
        const result = await replaceComponentAction(component.id, date.toISOString());
        if (result.success) {
          toast.success(`${component.name} replaced`, {
            description: `Replacement date: ${format(date, "PPP")}`,
          });
        } else {
          toast.error("Failed to replace component", { description: result.error });
        }
      } catch {
        toast.error("Failed to replace component", { description: "An unexpected error occurred" });
      }
    });
  }

  if (optimisticHidden) return null;

  const wear = calculateComponentWear(optimisticComponent);
  const cappedPercentage = Math.min(wear.percentage, 100);
  const isCustom = component.type === "custom";

  const installed = new Date(optimisticComponent.installed_at).getTime();
  const created = new Date(component.created_at).getTime();
  const wasReplaced = Math.abs(installed - created) >= 60_000;
  const installedLabel = wasReplaced ? "Replaced" : "Tracking since";
  const installedDate = format(new Date(optimisticComponent.installed_at), "d MMM yyyy");

  // True when the component was installed after the last sync — distances are stale
  const needsSync = lastSync
    ? new Date(optimisticComponent.installed_at) > new Date(lastSync)
    : false;

  const indicatorColor =
    wear.status === "critical"
      ? "bg-status-critical"
      : wear.status === "warning"
        ? "bg-status-warning"
        : "bg-status-healthy";

  // Brand/model/spec → shown on card face
  const hasFaceInfo = !!(
    optimisticComponent.brand ||
    optimisticComponent.model ||
    optimisticComponent.spec
  );

  // Lube type → lives behind expand toggle at the bottom
  const canExpand = !!optimisticComponent.lube_type;

  // All metadata null → show ghost CTA
  const isUnedited = !hasFaceInfo && !optimisticComponent.lube_type && !optimisticComponent.notes;

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
              <h4 className="text-sm font-medium truncate">
                {displayName ?? optimisticComponent.name}
              </h4>
              {isCustom && (
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  Custom
                </Badge>
              )}
              {outdoorOnly && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-normal text-muted-foreground shrink-0"
                >
                  Outdoor km only
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
                      <DropdownMenuItem onClick={handleMute}>
                        <BellOff className="mr-2 h-3.5 w-3.5" />
                        Mute
                      </DropdownMenuItem>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      Hide wear alerts for this component
                    </TooltipContent>
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
                    <TooltipContent side="right">
                      Remove this component from tracking
                    </TooltipContent>
                  </Tooltip>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Subtitle: brand/model text + spec chip, or unedited ghost CTA */}
          {(hasFaceInfo || isUnedited) && (
            <div className="flex items-center gap-1.5 min-w-0 mt-0.5 mb-3">
              {(optimisticComponent.brand || optimisticComponent.model) && (
                <span className="text-xs text-muted-foreground truncate">
                  {[optimisticComponent.brand, optimisticComponent.model].filter(Boolean).join(" ")}
                </span>
              )}
              {optimisticComponent.spec && (
                <Badge variant="outline" className="text-[10px] font-normal shrink-0">
                  {optimisticComponent.spec}
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

          {/* Notes — always visible above progress bar */}
          {optimisticComponent.notes && (
            <div className="mt-2 mb-3">
              <p
                ref={notesRef}
                className={cn(
                  "text-xs text-muted-foreground leading-relaxed",
                  !notesExpanded && "line-clamp-2"
                )}
              >
                {optimisticComponent.notes}
              </p>
              {notesOverflows && (
                <button
                  type="button"
                  onClick={() => setNotesExpanded((v) => !v)}
                  className="mt-0.5 text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-pointer"
                >
                  {notesExpanded ? "Show less" : "Show more"}
                </button>
              )}
            </div>
          )}

          {/* Wear bar */}
          <Progress
            value={cappedPercentage}
            className={cn(
              "h-2 mb-3",
              !hasFaceInfo && !isUnedited && !optimisticComponent.notes && "mt-3"
            )}
            indicatorClassName={indicatorColor}
          />

          {/* Install date */}
          <div className="mb-2">
            <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
              {installedLabel}: {installedDate}
            </Badge>
          </div>

          {/* Distance row + expand toggle */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: keyboard + role="button" provide a11y semantics */}
          {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: aria-expanded is valid for role="button" */}
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
            onKeyDown={
              canExpand
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") setExpanded((v) => !v);
                  }
                : undefined
            }
          >
            {outdoorOnly ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-default">
                    {formatDistance(optimisticComponent.current_distance ?? 0)} /{" "}
                    {formatDistance(optimisticComponent.recommended_distance)}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Virtual rides not counted for this component</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <span>
                {formatDistance(optimisticComponent.current_distance ?? 0)} /{" "}
                {formatDistance(optimisticComponent.recommended_distance)}
              </span>
            )}
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

          {/* Expanded metadata: lube type */}
          {canExpand && expanded && (
            <div className="mt-3 pt-3 border-t">
              <Badge variant="secondary" className="text-[10px]">
                {LUBE_LABELS[optimisticComponent.lube_type as LubeType]}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs — rendered outside the DropdownMenu tree */}
      <EditComponentDialog
        component={component}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={handleSaveEdit}
      />

      <ReplaceDialog
        componentName={component.name}
        open={replaceOpen}
        onOpenChange={setReplaceOpen}
        onReplace={handleReplace}
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
            <AlertDialogAction onClick={handleDelete}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
