"use client";

import { useState, useOptimistic, startTransition } from "react";
import { Settings2, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ComponentList } from "./component-list";
import { AddComponentDialog } from "./add-component-dialog";
import { BikeConfigDialog } from "./bike-config-dialog";
import { formatDistance } from "@/lib/wear/calculator";
import { getBikeConfig } from "@/lib/components/visibility";
import { getBatteryHealth } from "@/lib/wear/battery";
import { markChargedAction } from "@/app/actions/bike-config";
import { cn } from "@/lib/utils";
import type { BikeWithComponents, ElectronicSystem } from "@/lib/supabase/types";

const ELECTRONIC_LABELS: Record<ElectronicSystem, string> = {
  di2: "Di2",
  axs: "AXS",
  eps: "EPS",
  other: "Electronic",
};

interface BikeDetailProps {
  bike: BikeWithComponents;
  typesWithHistory?: Set<string>;
  lastSync?: string | null;
}

export function BikeDetail({ bike, typesWithHistory = new Set(), lastSync }: BikeDetailProps) {
  const [configOpen, setConfigOpen] = useState(false);
  const [chargeConfirmOpen, setChargeConfirmOpen] = useState(false);

  const subtitle = [bike.brand_name, bike.model_name].filter(Boolean).join(" ");
  const config = getBikeConfig(bike);

  const isElectronic = bike.shifting_type === "electronic";

  // km since last charge (meters → km)
  const kmSinceCharge =
    bike.last_charge_distance != null
      ? Math.round((bike.total_distance - bike.last_charge_distance) / 1000)
      : null;

  const [optimisticKm, setOptimisticKm] = useOptimistic<number | null>(kmSinceCharge);

  const batteryHealth = getBatteryHealth(
    optimisticKm,
    bike.electronic_system,
    bike.created_at
  );

  function handleConfirmCharge() {
    setChargeConfirmOpen(false);
    startTransition(async () => {
      setOptimisticKm(0);
      await markChargedAction(bike.id);
    });
  }

  const systemLabel = bike.electronic_system
    ? ELECTRONIC_LABELS[bike.electronic_system as ElectronicSystem]
    : "Electronic";

  const chipClass = cn(
    "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    batteryHealth.status === "critical"
      ? "border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive/20"
      : batteryHealth.status === "warning"
        ? "border-amber-500/50 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
        : "border-border hover:bg-muted"
  );

  // Tooltip body text
  const tooltipDetails = (() => {
    const range = batteryHealth.effectiveRange;
    if (batteryHealth.status === "critical") {
      return `Charge recommended — ${Math.abs(batteryHealth.remainingKm ?? 0)} km overdue (range: ${range} km)`;
    }
    if (batteryHealth.status === "warning") {
      return `Charge soon — ${batteryHealth.remainingKm} km remaining (range: ${range} km)`;
    }
    if (batteryHealth.remainingKm != null) {
      return `${batteryHealth.remainingKm} km until next charge recommended (range: ${range} km)`;
    }
    return `Recommended range: ${range} km per charge. Tap to mark battery charged.`;
  })();

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{bike.name}</CardTitle>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {bike.is_primary && <Badge variant="secondary">Primary</Badge>}
              <Badge variant="outline">{formatDistance(bike.total_distance)}</Badge>

              {/* Electronic charge chip */}
              {isElectronic && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setChargeConfirmOpen(true)}
                      aria-label="Mark battery charged — resets km counter"
                      className={chipClass}
                    >
                      <Zap className="h-3 w-3" />
                      <span>{systemLabel}</span>
                      <span className="opacity-50">·</span>
                      <span>
                        {optimisticKm != null
                          ? `${optimisticKm.toLocaleString()} km`
                          : "— km"}
                      </span>
                      {batteryHealth.status === "critical" && (
                        <span className="font-semibold">· Charge now</span>
                      )}
                      {batteryHealth.status === "warning" && (
                        <span className="opacity-80">· Charge soon</span>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="max-w-xs">{tooltipDetails}</p>
                    <p className="text-muted-foreground mt-0.5">
                      Tap to mark battery charged
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setConfigOpen(true)}
                aria-label={bike.config_complete ? "Re-configure bike" : "Configure bike"}
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Config prompt — shown only when not yet configured */}
          {!bike.config_complete && (
            <button
              onClick={() => setConfigOpen(true)}
              className="w-full mb-4 flex items-start gap-3 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-3 text-left transition-colors hover:border-muted-foreground/50 hover:bg-muted/50"
            >
              <Settings2 className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Set up {bike.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure shifting, brakes, and tire system to see the right
                  components and replacement intervals.
                </p>
              </div>
            </button>
          )}

          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Components</h3>
            <AddComponentDialog bike={bike} />
          </div>
          <ComponentList
            components={bike.components}
            typesWithHistory={typesWithHistory}
            bikeConfig={config}
            lastSync={lastSync}
            bikeId={bike.id}
          />
        </CardContent>
      </Card>

      <BikeConfigDialog
        bike={bike}
        open={configOpen}
        onOpenChange={setConfigOpen}
      />

      {/* Charge confirmation */}
      <AlertDialog open={chargeConfirmOpen} onOpenChange={setChargeConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark battery as charged?</AlertDialogTitle>
            <AlertDialogDescription>
              This resets the km counter to 0. Only confirm if you have actually
              plugged in and charged the battery.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCharge}>
              Mark charged
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
