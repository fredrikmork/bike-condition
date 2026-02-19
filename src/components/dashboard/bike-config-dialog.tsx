"use client";

import { useState } from "react";
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
import { cn } from "@/lib/utils";
import { saveBikeConfigAction } from "@/app/actions/bike-config";
import type { Bike, BikeConfig, ShiftingType, BrakeType, TireSystem } from "@/lib/supabase/types";

interface BikeConfigDialogProps {
  bike: Bike;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SPEEDS = [8, 9, 10, 11, 12, 13] as const;

export function BikeConfigDialog({ bike, open, onOpenChange }: BikeConfigDialogProps) {
  const [shifting, setShifting] = useState<ShiftingType | null>(
    (bike.shifting_type as ShiftingType) ?? null
  );
  const [brakes, setBrakes] = useState<BrakeType | null>(
    (bike.brake_type as BrakeType) ?? null
  );
  const [speed, setSpeed] = useState<number | null>(bike.drivetrain_speed ?? null);
  const [tires, setTires] = useState<TireSystem | null>(
    (bike.tire_system as TireSystem) ?? null
  );
  const [saving, setSaving] = useState(false);

  const isComplete = shifting !== null && brakes !== null && speed !== null && tires !== null;

  async function handleSave() {
    if (!isComplete) return;
    setSaving(true);
    try {
      const config: BikeConfig = {
        shifting_type: shifting,
        brake_type: brakes,
        drivetrain_speed: speed,
        tire_system: tires,
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
                  onClick={() => setSpeed(s)}
                  className={cn(
                    "h-9 w-12 rounded-md border text-sm font-medium transition-colors",
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
      onClick={onClick}
      className={cn(
        "flex flex-col gap-0.5 rounded-lg border p-3 text-left transition-colors",
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
