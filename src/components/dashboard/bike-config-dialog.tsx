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
import { BIKE_TYPES, BIKE_TYPE_LABELS, STRAVA_FRAME_TYPE_MAP } from "@/lib/bikes/types";
import type { Bike, BikeConfig, ShiftingType, BrakeType, TireSystem } from "@/lib/supabase/types";
import type { BikeType } from "@/lib/bikes/types";

interface BikeConfigDialogProps {
  bike: Bike;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SPEEDS = [8, 9, 10, 11, 12, 13] as const;

export function BikeConfigDialog({ bike, open, onOpenChange }: BikeConfigDialogProps) {
  // Auto-detect bike type from Strava frame_type if not already set
  const detectedType: BikeType | null = bike.frame_type
    ? (STRAVA_FRAME_TYPE_MAP[bike.frame_type] ?? null)
    : null;
  const needsBikeTypeStep = !bike.bike_type && !detectedType;

  const [bikeType, setBikeType] = useState<BikeType | null>(
    (bike.bike_type as BikeType) ?? detectedType ?? null
  );
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

  // Step management: only show bike type step if needed and no auto-detect
  const steps = needsBikeTypeStep
    ? (['bike_type', 'shifting', 'brakes', 'drivetrain', 'tires'] as const)
    : (['shifting', 'brakes', 'drivetrain', 'tires'] as const);
  type Step = typeof steps[number];
  const [stepIndex, setStepIndex] = useState(0);
  const currentStep: Step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  function canAdvance(): boolean {
    switch (currentStep) {
      case 'bike_type':  return bikeType !== null;
      case 'shifting':   return shifting !== null;
      case 'brakes':     return brakes !== null;
      case 'drivetrain': return speed !== null;
      case 'tires':      return tires !== null;
    }
  }

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
      // Pass the resolved bike type (either user-selected or auto-detected)
      const resolvedType = bikeType ?? detectedType ?? null;
      const result = await saveBikeConfigAction(bike.id, config, resolvedType);
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

  function handleNext() {
    if (isLastStep) {
      handleSave();
    } else {
      setStepIndex((i) => i + 1);
    }
  }

  const stepLabel = {
    bike_type:  'Bike type',
    shifting:   'Shifting system',
    brakes:     'Brake system',
    drivetrain: 'Drivetrain speed',
    tires:      'Tire system',
  }[currentStep];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Configure {bike.name}</DialogTitle>
          <DialogDescription>
            {needsBikeTypeStep
              ? `Step ${stepIndex + 1} of ${steps.length}: ${stepLabel}`
              : 'Tell us about your setup so we show the right components and replacement intervals.'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {/* Bike type step */}
          {currentStep === 'bike_type' && (
            <Section label="What type of bike is this?">
              <div className="grid grid-cols-2 gap-3">
                {BIKE_TYPES.map((t) => (
                  <OptionCard
                    key={t}
                    selected={bikeType === t}
                    onClick={() => setBikeType(t)}
                    title={BIKE_TYPE_LABELS[t]}
                    description=""
                  />
                ))}
              </div>
            </Section>
          )}

          {/* Shifting step */}
          {currentStep === 'shifting' && (
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
          )}

          {/* Brakes step */}
          {currentStep === 'brakes' && (
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
          )}

          {/* Drivetrain speed step */}
          {currentStep === 'drivetrain' && (
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
          )}

          {/* Tires step */}
          {currentStep === 'tires' && (
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
          )}
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between gap-2">
          <div className="flex gap-2">
            {stepIndex > 0 && (
              <Button variant="outline" onClick={() => setStepIndex((i) => i - 1)} disabled={saving}>
                Back
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
          </div>
          <Button
            onClick={handleNext}
            disabled={!canAdvance() || (isLastStep && !isComplete) || saving}
          >
            {saving ? "Saving…" : isLastStep ? "Save configuration" : "Next"}
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
      {description && <span className="text-xs opacity-70">{description}</span>}
    </button>
  );
}
