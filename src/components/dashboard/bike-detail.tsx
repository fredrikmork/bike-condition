"use client";

import { format } from "date-fns";
import { CalendarIcon, Settings2 } from "lucide-react";
import { startTransition, useOptimistic, useState } from "react";
import { markChargedAction } from "@/app/actions/bike-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getBikeConfig } from "@/lib/components/visibility";
import type { BikeWithComponents, ElectronicSystem } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { getBatteryHealth } from "@/lib/wear/battery";
import { formatDistance } from "@/lib/wear/calculator";
import { AddComponentDialog } from "./add-component-dialog";
import { BatteryIcon } from "./battery-icon";
import { BikeConfigDialog } from "./bike-config-dialog";
import { ComponentList } from "./component-list";
import { MutedComponentsSheet } from "./muted-components-sheet";

const ELECTRONIC_LABELS: Record<ElectronicSystem, string> = {
  di2: "Di2",
  axs: "AXS",
  eps: "EPS",
  other: "Electronic",
};

const FRAME_TYPE_LABELS: Record<number, string> = {
  1: "Mountain",
  2: "Cross",
  3: "Road",
  4: "Time Trial",
};

function formatSportType(sport: string): string {
  // Convert CamelCase sport types to readable labels
  return sport
    .replace(/([A-Z])/g, " $1")
    .trim()
    .replace("Virtual Ride", "Virtual")
    .replace("Mountain Bike Ride", "MTB")
    .replace("Gravel Ride", "Gravel");
}

interface BikeDetailProps {
  bike: BikeWithComponents;
  typesWithHistory?: Set<string>;
  lastSync?: string | null;
  virtualKm?: number;
}

export function BikeDetail({
  bike,
  typesWithHistory = new Set(),
  lastSync,
  virtualKm = 0,
}: BikeDetailProps) {
  const [configOpen, setConfigOpen] = useState(false);
  const [chargeDialogOpen, setChargeDialogOpen] = useState(false);
  const [mutedSheetOpen, setMutedSheetOpen] = useState(false);

  const hasVirtualRides = virtualKm > 0;

  const mutedComponents = bike.components.filter((c) => c.muted);
  const [chargeDate, setChargeDate] = useState<Date>(new Date());
  const [charging, setCharging] = useState(false);

  const subtitle = [bike.brand_name, bike.model_name].filter(Boolean).join(" ");
  const config = getBikeConfig(bike);

  const isElectronic = bike.shifting_type === "electronic";

  // km since last charge (meters → km)
  const kmSinceCharge =
    bike.last_charge_distance != null
      ? Math.round(((bike.total_distance ?? 0) - bike.last_charge_distance) / 1000)
      : null;

  const [optimisticKm, setOptimisticKm] = useOptimistic<number | null>(kmSinceCharge);

  // User-set warn distance (km per charge) — empty string means "use auto-estimate".
  const [warnKm, setWarnKm] = useState<string>(
    bike.battery_range_km != null ? String(bike.battery_range_km) : ""
  );

  const batteryHealth = getBatteryHealth(
    optimisticKm,
    bike.electronic_system,
    bike.created_at,
    bike.battery_range_km
  );

  function handleConfirmCharge() {
    setChargeDialogOpen(false);
    setCharging(true);
    const trimmed = warnKm.trim();
    const rangeKm = trimmed === "" ? null : Number(trimmed);
    startTransition(async () => {
      setOptimisticKm(0);
      try {
        await markChargedAction(
          bike.id,
          chargeDate.toISOString(),
          Number.isFinite(rangeKm as number) ? rangeKm : null
        );
      } finally {
        setCharging(false);
      }
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

  const lastChargeLabel = bike.last_charge_date
    ? `Last charged: ${format(new Date(bike.last_charge_date), "d MMM yyyy")}`
    : null;

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
    return `Recommended range: ${range} km per charge.`;
  })();

  const frameLabel = bike.frame_type != null ? FRAME_TYPE_LABELS[bike.frame_type] : null;
  const sportLabel = bike.default_sport_type ? formatSportType(bike.default_sport_type) : null;
  const weightLabel = bike.weight != null ? `${bike.weight.toFixed(1)} kg` : null;

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">{bike.name}</h2>
            {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
            {/* Bike metadata chips */}
            {(frameLabel || sportLabel || weightLabel) && (
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {frameLabel && (
                  <span
                    className="inline-flex rounded-md p-px"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--chip-frame-from), var(--chip-frame-to))",
                    }}
                  >
                    <Badge
                      className="text-xs font-normal border-0 rounded-[5px]"
                      style={{ backgroundColor: "var(--card)", color: "var(--chip-frame-text)" }}
                    >
                      {frameLabel}
                    </Badge>
                  </span>
                )}
                {sportLabel && (
                  <span
                    className="inline-flex rounded-md p-px"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--chip-sport-from), var(--chip-sport-to))",
                    }}
                  >
                    <Badge
                      className="text-xs font-normal border-0 rounded-[5px]"
                      style={{ backgroundColor: "var(--card)", color: "var(--chip-sport-text)" }}
                    >
                      {sportLabel}
                    </Badge>
                  </span>
                )}
                {weightLabel && (
                  <span
                    className="inline-flex rounded-md p-px"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--chip-weight-from), var(--chip-weight-to))",
                    }}
                  >
                    <Badge
                      className="text-xs font-normal border-0 rounded-[5px]"
                      style={{ backgroundColor: "var(--card)", color: "var(--chip-weight-text)" }}
                    >
                      {weightLabel}
                    </Badge>
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Badge variant="outline">{formatDistance(bike.total_distance ?? 0)}</Badge>
            {hasVirtualRides && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-muted-foreground">
                    {formatDistance(virtualKm)} virtual
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="max-w-xs">
                    {formatDistance(virtualKm)} ridden on an indoor trainer (Zwift / virtual rides).
                    Wheels and brake cables do not count this distance.
                  </p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Electronic charge chip */}
            {isElectronic && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      setChargeDate(new Date());
                      setChargeDialogOpen(true);
                    }}
                    disabled={charging}
                    aria-label="Mark battery charged"
                    className={chipClass}
                  >
                    <BatteryIcon health={batteryHealth} className="h-3.5 w-3.5" />
                    <span>{systemLabel}</span>
                    <span className="opacity-50">·</span>
                    <span>
                      {optimisticKm != null ? `${optimisticKm.toLocaleString()} km` : "— km"}
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
                  {lastChargeLabel && (
                    <p className="text-muted-foreground mt-0.5">{lastChargeLabel}</p>
                  )}
                  <p className="text-muted-foreground mt-0.5">Tap to mark battery charged</p>
                </TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setConfigOpen(true)}
                  aria-label={bike.config_complete ? "Re-configure bike" : "Configure bike"}
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="max-w-xs">
                  Configure your bike setup — shifting, brakes, drivetrain speed, and tire system.
                  This determines which components and replacement intervals are shown.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

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
                Configure shifting, brakes, and tire system to see the right components and
                replacement intervals.
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
          hasVirtualRides={hasVirtualRides}
        />

        {mutedComponents.length > 0 && (
          <button
            onClick={() => setMutedSheetOpen(true)}
            className="mt-3 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            {mutedComponents.length} hidden component{mutedComponents.length !== 1 ? "s" : ""}
          </button>
        )}
      </div>

      <BikeConfigDialog key={bike.id} bike={bike} open={configOpen} onOpenChange={setConfigOpen} />

      <MutedComponentsSheet
        components={mutedComponents}
        open={mutedSheetOpen}
        onOpenChange={setMutedSheetOpen}
      />

      {/* Charge dialog */}
      <Dialog open={chargeDialogOpen} onOpenChange={setChargeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark battery as charged</DialogTitle>
            <DialogDescription>
              Pick the date you charged the battery. The km counter resets to 0 from the current
              distance.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2 py-2">
            <Label htmlFor="charge-date">Charge date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="charge-date"
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(chargeDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={chargeDate}
                  onSelect={(d) => d && setChargeDate(d)}
                  disabled={{ after: new Date() }}
                  defaultMonth={chargeDate}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2 py-2">
            <Label htmlFor="warn-km">Warn after (km)</Label>
            <Input
              id="warn-km"
              type="number"
              inputMode="numeric"
              min={1}
              placeholder={`Auto (${batteryHealth.effectiveRange} km)`}
              value={warnKm}
              onChange={(e) => setWarnKm(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Distance per charge before the battery indicator warns you. Leave empty to estimate
              automatically from your drivetrain.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setChargeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmCharge}>Mark charged</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
