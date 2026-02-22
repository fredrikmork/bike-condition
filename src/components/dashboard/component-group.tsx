"use client";

import { useState } from "react";
import { ChevronDown, CircleDot, Cog, PauseCircle, RotateCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ComponentCard } from "./component-card";
import { BatchReplaceDialog } from "./batch-replace-dialog";
import { StatusIndicator } from "./status-indicator";
import { calculateComponentWear, formatDistance } from "@/lib/wear/calculator";
import type { ComponentGroupDef } from "@/lib/components/groups";
import type { Component } from "@/lib/supabase/types";

interface ComponentGroupProps {
  group: ComponentGroupDef;
  components: Component[];
  typesWithHistory?: Set<string>;
  lastSync?: string | null;
  bikeId: string;
  trainerActive?: boolean;
}

export function ComponentGroup({
  group,
  components,
  typesWithHistory = new Set(),
  lastSync,
  bikeId,
  trainerActive = false,
}: ComponentGroupProps) {
  const [expanded, setExpanded] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);

  if (components.length === 0) return null;

  // Compute worst status across all group components
  const wears = components.map((c) => calculateComponentWear(c));
  const worstStatus = wears.reduce<"healthy" | "warning" | "critical">(
    (worst, w) => {
      if (w.status === "critical") return "critical";
      if (w.status === "warning" && worst !== "critical") return "warning";
      return worst;
    },
    "healthy"
  );
  const worstIsOverdue = wears.some((w) => w.isOverdue);

  // Most-worn component by percentage
  const mostWorn = components.reduce((prev, curr) => {
    const p = calculateComponentWear(prev).percentage;
    const c = calculateComponentWear(curr).percentage;
    return c > p ? curr : prev;
  }, components[0]);
  const mostWornWear = calculateComponentWear(mostWorn);

  const Icon = group.id === "drivetrain" ? Cog : CircleDot;

  function shortName(name: string) {
    if (group.id === "front_wheel") {
      return name.replace(/^front\s+/i, "").replace(/\s*\(front\)/i, "");
    }
    if (group.id === "rear_wheel") {
      return name.replace(/^rear\s+/i, "").replace(/\s*\(rear\)/i, "");
    }
    return name;
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          {/* Summary row — always visible */}
          <button
            type="button"
            className="w-full flex items-center gap-3 px-4 py-3 text-left"
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
                {trainerActive && (
                  <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground gap-1">
                    <PauseCircle className="h-2.5 w-2.5" />
                    Trainer
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {shortName(mostWorn.name)}
                {" — "}
                {Math.round(Math.min(mostWornWear.percentage, 100))}%
                {" · "}
                {formatDistance(mostWornWear.remainingDistance)} left
              </p>
            </div>

            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                expanded && "rotate-180"
              )}
            />
          </button>

          {/* Expanded contents */}
          {expanded && (
            <div className="px-4 pb-4 border-t pt-3 space-y-3">
              {group.canBatchReplace && (
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
                    trainerActive={trainerActive}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {group.canBatchReplace && (
        <BatchReplaceDialog
          group={group}
          components={components}
          open={batchOpen}
          onOpenChange={setBatchOpen}
        />
      )}
    </>
  );
}
