"use client";

import { Bike as BikeIcon, ChevronDown, Pencil, RotateCw } from "lucide-react";
import { useEffect, useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { updateComponentAction } from "@/app/actions/components";
import { DrivetrainIcon, SpokedWheelIcon } from "@/components/icons/component-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ComponentGroupDef } from "@/lib/components/groups";
import { TRAINER_PAUSE_TYPES } from "@/lib/components/groups";
import type { AnyIcon } from "@/lib/components/icons";
import { useBikeStore } from "@/lib/stores/bike-store";
import type { Component } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { calculateComponentWear } from "@/lib/wear/calculator";
import { BatchReplaceDialog } from "./batch-replace-dialog";
import { ComponentCard } from "./component-card";
import { EditComponentDialog, type UpdateComponentData } from "./edit-component-dialog";
import { StatusIndicator } from "./status-indicator";

interface ComponentGroupProps {
  group: ComponentGroupDef;
  /** The part the group hangs off — a wheel or the drivetrain. Null for frame. */
  container?: Component | null;
  components: Component[];
  typesWithHistory?: Set<string>;
  lastSync?: string | null;
  hasVirtualRides?: boolean;
  /** Fallback description when the group has no container of its own */
  subtitle?: string | null;
  /** The bike's silhouette icon — shown on the Frame group (the frame IS the bike) */
  bikeIcon?: AnyIcon | null;
  readOnly?: boolean;
}

export function ComponentGroup({
  group,
  container = null,
  components,
  typesWithHistory = new Set(),
  lastSync,
  hasVirtualRides = false,
  subtitle = null,
  bikeIcon = null,
  readOnly = false,
}: ComponentGroupProps) {
  // The drivetrain is the group people check most often, so it starts open.
  const [expanded, setExpanded] = useState(group.id === "drivetrain");
  const [batchOpen, setBatchOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const { focusedComponentId } = useBikeStore();
  const [, startTransition] = useTransition();

  const [optimisticContainer, applyContainerUpdate] = useOptimistic(
    container,
    (state: Component | null, update: Partial<Component>) =>
      state ? { ...state, ...update } : state
  );

  useEffect(() => {
    if (components.some((c) => c.id === focusedComponentId)) {
      setExpanded(true);
    }
  }, [focusedComponentId, components]);

  if (components.length === 0) return null;

  // Compute worst status across all group components
  const wears = components.map((c) => calculateComponentWear(c));
  const worstStatus = wears.reduce<"healthy" | "warning" | "critical">((worst, w) => {
    if (w.status === "critical") return "critical";
    if (w.status === "warning" && worst !== "critical") return "warning";
    return worst;
  }, "healthy");
  const worstIsOverdue = wears.some((w) => w.isOverdue);

  // Part-shaped icons (Trello #14): a spoked wheel for the wheel groups, a
  // chainring-and-cog for the drivetrain, the bike's own silhouette for Frame.
  const Icon =
    group.id === "drivetrain"
      ? DrivetrainIcon
      : group.id === "frame"
        ? (bikeIcon ?? BikeIcon)
        : SpokedWheelIcon;

  // Only badge the whole group when every part in it skips indoor km. The Frame
  // group mixes pads and cables (which do) with cleats and custom parts (which
  // don't), so there it falls to the individual cards.
  const allOutdoorOnly = components.every((c) => TRAINER_PAUSE_TYPES.has(c.type));

  function shortName(name: string) {
    if (group.id === "front_wheel") {
      return name.replace(/^front\s+/i, "").replace(/\s*\(front\)/i, "");
    }
    if (group.id === "rear_wheel") {
      return name.replace(/^rear\s+/i, "").replace(/\s*\(rear\)/i, "");
    }
    return name;
  }

  // What the user typed in themselves wins the description line — the whole
  // point of recording a groupset's brand and model is to recognise it here.
  // Notes trail the two, so the identity reads first and the remark second.
  const containerLabel = optimisticContainer
    ? [
        [optimisticContainer.brand, optimisticContainer.model].filter(Boolean).join(" ").trim(),
        optimisticContainer.notes?.trim(),
      ]
        .filter(Boolean)
        .join(" · ") || null
    : null;
  const description = containerLabel ?? subtitle;
  const canEditContainer = !readOnly && !!optimisticContainer;

  function handleSaveContainer(data: UpdateComponentData) {
    setEditOpen(false);
    if (!container) return;
    startTransition(async () => {
      applyContainerUpdate({
        brand: data.brand,
        model: data.model,
        notes: data.notes,
      });
      try {
        const result = await updateComponentAction(container.id, data);
        if (result.success) {
          toast.success(`${group.label} updated`);
        } else {
          toast.error(`Failed to update ${group.label.toLowerCase()}`, {
            description: result.error,
          });
        }
      } catch {
        toast.error(`Failed to update ${group.label.toLowerCase()}`, {
          description: "An unexpected error occurred",
        });
      }
    });
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          {/* Summary row — always visible */}
          <div className="flex items-center gap-1 px-4 py-3">
            <button
              type="button"
              className="flex flex-1 items-center gap-3 min-w-0 text-left"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
            >
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{group.label}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {components.length}
                  </Badge>
                  <StatusIndicator status={worstStatus} isOverdue={worstIsOverdue} />
                  {hasVirtualRides && allOutdoorOnly && (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-normal text-muted-foreground"
                    >
                      Outdoor km only
                    </Badge>
                  )}
                </div>
                <p
                  className={cn(
                    "text-xs mt-0.5 truncate",
                    description ? "text-muted-foreground" : "text-muted-foreground/50"
                  )}
                >
                  {description ?? (canEditContainer ? "Add brand and model" : "No details added")}
                </p>
              </div>

              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                  expanded && "rotate-180"
                )}
              />
            </button>

            {canEditContainer && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    aria-label={`Edit ${group.label}`}
                    onClick={() => setEditOpen(true)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  Record this {group.label.toLowerCase()} — brand, model, notes
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Expanded contents */}
          {expanded && (
            <div className="px-4 pb-4 border-t pt-3 space-y-3">
              {group.canBatchReplace && !readOnly && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground hover:text-foreground -ml-1"
                  onClick={() => setBatchOpen(true)}
                >
                  <RotateCw className="h-3 w-3 mr-1.5" />
                  Replace whole wheel
                </Button>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {components.map((component) => (
                  <ComponentCard
                    key={component.id}
                    component={component}
                    hasHistory={typesWithHistory.has(component.type)}
                    lastSync={lastSync}
                    displayName={shortName(component.name)}
                    outdoorOnly={
                      hasVirtualRides && !allOutdoorOnly && TRAINER_PAUSE_TYPES.has(component.type)
                    }
                    readOnly={readOnly}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {group.canBatchReplace && !readOnly && (
        <BatchReplaceDialog
          group={group}
          components={components}
          open={batchOpen}
          onOpenChange={setBatchOpen}
        />
      )}

      {container && !readOnly && (
        <EditComponentDialog
          component={container}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSave={handleSaveContainer}
        />
      )}
    </>
  );
}
