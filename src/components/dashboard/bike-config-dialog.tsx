"use client";

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { saveBikeConfigAction } from "@/app/actions/bike-config";
import {
  getVirtualPeriodsAction,
  addVirtualPeriodAction,
  removeVirtualPeriodAction,
} from "@/app/actions/virtual-periods";
import type { Bike, BikeConfig, ShiftingType, BrakeType, TireSystem, ElectronicSystem, VirtualPeriod } from "@/lib/supabase/types";

interface BikeConfigDialogProps {
  bike: Bike;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SPEEDS = [8, 9, 10, 11, 12, 13] as const;

const ELECTRONIC_SYSTEMS: { value: ElectronicSystem; label: string; description: string }[] = [
  { value: "di2", label: "Shimano Di2", description: "Electronic shifting" },
  { value: "axs", label: "SRAM AXS", description: "Wireless electronic" },
  { value: "eps", label: "Campagnolo EPS", description: "Electronic Power Shift" },
  { value: "other", label: "Other", description: "Other electronic system" },
];

export function BikeConfigDialog({ bike, open, onOpenChange }: BikeConfigDialogProps) {
  const [shifting, setShifting] = useState<ShiftingType | null>(
    (bike.shifting_type as ShiftingType) ?? null
  );
  const [electronicSystem, setElectronicSystem] = useState<ElectronicSystem | null>(
    (bike.electronic_system as ElectronicSystem) ?? null
  );
  const [brakes, setBrakes] = useState<BrakeType | null>(
    (bike.brake_type as BrakeType) ?? null
  );
  const [speed, setSpeed] = useState<number | null>(bike.drivetrain_speed ?? null);
  const [tires, setTires] = useState<TireSystem | null>(
    (bike.tire_system as TireSystem) ?? null
  );
  const [saving, setSaving] = useState(false);
  const [periods, setPeriods] = useState<VirtualPeriod[]>([]);
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [addingPeriod, setAddingPeriod] = useState(false);

  const isComplete = shifting !== null && brakes !== null && speed !== null && tires !== null;

  // Load trainer periods when dialog opens
  useEffect(() => {
    if (!open) return;
    getVirtualPeriodsAction(bike.id).then((r) => {
      if (r.success && r.data) setPeriods(r.data);
    });
  }, [open, bike.id]);

  async function handleAddPeriod() {
    if (!newStart) return;
    setAddingPeriod(true);
    try {
      const result = await addVirtualPeriodAction(bike.id, newStart, newEnd || null);
      if (result.success) {
        const refreshed = await getVirtualPeriodsAction(bike.id);
        if (refreshed.success && refreshed.data) setPeriods(refreshed.data);
        setNewStart("");
        setNewEnd("");
      } else {
        toast.error("Could not add period", { description: result.error });
      }
    } finally {
      setAddingPeriod(false);
    }
  }

  async function handleRemovePeriod(periodId: string) {
    const result = await removeVirtualPeriodAction(periodId);
    if (result.success) {
      setPeriods((prev) => prev.filter((p) => p.id !== periodId));
    } else {
      toast.error("Could not remove period", { description: result.error });
    }
  }

  async function handleSave() {
    if (!isComplete) return;
    setSaving(true);
    try {
      const config: BikeConfig = {
        shifting_type: shifting,
        brake_type: brakes,
        drivetrain_speed: speed,
        tire_system: tires,
        ...(shifting === "electronic" && electronicSystem ? { electronic_system: electronicSystem } : {}),
      };
      const result = await saveBikeConfigAction(bike.id, config);
      if (result.success) {
        toast.success("Bike configured", {
          description: "Component list updated to match your setup.",
        });
        onOpenChange(false);
      } else {
        toast.error("Failed to save configuration", { description: result.error });
      }
    } catch {
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Configure {bike.name}</DialogTitle>
          <DialogDescription>
            Tell us about your setup so we show the right components and
            replacement intervals.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-2">
          {/* Shifting */}
          <Section label="Shifting system">
            <div className="grid grid-cols-2 gap-3">
              <OptionCard
                selected={shifting === "mechanical"}
                onClick={() => setShifting("mechanical")}
                title="Mechanical"
                description="Cables & levers"
              />
              <OptionCard
                selected={shifting === "electronic"}
                onClick={() => setShifting("electronic")}
                title="Electronic"
                description="Di2 / AXS / EPS"
              />
            </div>

            {/* Electronic system sub-selector */}
            {shifting === "electronic" && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {ELECTRONIC_SYSTEMS.map((sys) => (
                  <button
                    key={sys.value}
                    type="button"
                    onClick={() => setElectronicSystem(sys.value)}
                    aria-pressed={electronicSystem === sys.value}
                    className={cn(
                      "flex flex-col gap-0.5 rounded-lg border p-2.5 text-left text-xs transition-colors cursor-pointer",
                      electronicSystem === sys.value
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                    )}
                  >
                    <span className="font-medium">{sys.label}</span>
                    <span className="opacity-70">{sys.description}</span>
                  </button>
                ))}
              </div>
            )}
          </Section>

          {/* Brakes */}
          <Section label="Brake system">
            <div className="grid grid-cols-2 gap-3">
              <OptionCard
                selected={brakes === "disc"}
                onClick={() => setBrakes("disc")}
                title="Disc brakes"
                description="Hydraulic or mechanical disc"
              />
              <OptionCard
                selected={brakes === "rim"}
                onClick={() => setBrakes("rim")}
                title="Rim brakes"
                description="Caliper or cantilever"
              />
            </div>
          </Section>

          {/* Drivetrain speed */}
          <Section label="Drivetrain speed">
            <div className="flex flex-wrap gap-2">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpeed(s)}
                  aria-pressed={speed === s}
                  aria-label={`${s}-speed`}
                  className={cn(
                    "h-9 w-12 cursor-pointer rounded-md border text-sm font-medium transition-colors",
                    speed === s
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </Section>

          {/* Tire system */}
          <Section label="Tire system">
            <div className="grid grid-cols-3 gap-3">
              <OptionCard
                selected={tires === "tubeless"}
                onClick={() => setTires("tubeless")}
                title="Tubeless"
                description="No inner tube"
              />
              <OptionCard
                selected={tires === "clincher"}
                onClick={() => setTires("clincher")}
                title="Clincher"
                description="With inner tube"
              />
              <OptionCard
                selected={tires === "tubular"}
                onClick={() => setTires("tubular")}
                title="Tubular"
                description="Glued / taped"
              />
            </div>
          </Section>

          {/* Trainer / virtual periods */}
          <Section label="Trainer periods">
            <p className="text-xs text-muted-foreground -mt-1">
              Add date ranges when this bike was on an indoor trainer. Tires, inner tubes, brake pads and rotors won&apos;t accumulate distance from virtual rides during these periods — the wheels stay on the real bike.
            </p>

            {/* Existing periods */}
            {periods.length > 0 && (
              <div className="space-y-1.5">
                {periods.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <span>
                      {format(parseISO(p.start_date), "d MMM yyyy")}
                      {" — "}
                      {p.end_date ? format(parseISO(p.end_date), "d MMM yyyy") : "ongoing"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePeriod(p.id)}
                      className="ml-2 text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Remove period"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new period */}
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
              <div className="grid gap-1">
                <Label className="text-xs">From</Label>
                <Input
                  type="date"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">To (leave empty = ongoing)</Label>
                <Input
                  type="date"
                  value={newEnd}
                  min={newStart || undefined}
                  onChange={(e) => setNewEnd(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                disabled={!newStart || addingPeriod}
                onClick={handleAddPeriod}
              >
                Add
              </Button>
            </div>
          </Section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isComplete || saving}>
            {saving ? "Saving…" : "Save configuration"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium">{label}</p>
      {children}
    </div>
  );
}

function OptionCard({
  selected,
  onClick,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex cursor-pointer flex-col gap-0.5 rounded-lg border p-3 text-left transition-colors",
        selected
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground"
      )}
    >
      <span className="text-sm font-medium leading-tight">{title}</span>
      <span className="text-xs opacity-70">{description}</span>
    </button>
  );
}
