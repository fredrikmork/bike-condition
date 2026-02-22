"use client";

import { useState, useEffect } from "react";
import { Plus, Check, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addCustomComponentAction, addTypedComponentAction } from "@/app/actions/components";
import { CUSTOM_ICON_OPTIONS } from "@/lib/components/icons";
import { getRegistryForBike } from "@/lib/bikes/component-registry";
import { getBikeConfig } from "@/lib/components/visibility";
import { STRAVA_FRAME_TYPE_MAP } from "@/lib/bikes/types";
import { cn } from "@/lib/utils";
import type { BikeWithComponents } from "@/lib/supabase/types";
import type { BikeType } from "@/lib/bikes/types";

interface AddComponentDialogProps {
  bikeId: string;
  bike?: BikeWithComponents;
  // Controlled mode (from ghost hotspot)
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  preselectedType?: string | null;
}

export function AddComponentDialog({
  bikeId,
  bike,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  preselectedType,
}: AddComponentDialogProps) {
  const isControlled = openProp !== undefined;
  const [openLocal, setOpenLocal] = useState(false);
  const open = isControlled ? openProp! : openLocal;
  const setOpen = isControlled ? onOpenChangeProp! : setOpenLocal;

  // Resolve bike type for registry
  const bikeType: BikeType | null = bike
    ? (bike.bike_type ??
        (bike.frame_type != null ? (STRAVA_FRAME_TYPE_MAP[bike.frame_type] ?? null) : null))
    : null;

  // Registry for this bike (null = show all)
  const config = bike ? getBikeConfig(bike) : null;
  const registry = bikeType ? getRegistryForBike(bikeType, config) : [];

  // Already-added unique types
  const addedTypes = new Set(bike?.components.map((c) => c.type) ?? []);

  // Steps: 'type' | 'details'
  const [step, setStep] = useState<'type' | 'details'>('type');
  const [selectedType, setSelectedType] = useState<string>('');
  const [name, setName] = useState('');
  const [distance, setDistance] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [spec, setSpec] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('wrench');
  const [loading, setLoading] = useState(false);

  // Pre-fill when opened from ghost hotspot
  useEffect(() => {
    if (open && preselectedType) {
      const spec_ = registry.find((s) => s.type === preselectedType);
      setSelectedType(preselectedType);
      if (spec_) {
        setName(spec_.label);
        setDistance(String(spec_.defaultRecommendedDistance / 1000));
      }
      setStep('details');
    } else if (open && !preselectedType) {
      setStep(registry.length > 0 ? 'type' : 'details');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preselectedType]);

  function reset() {
    setStep('type');
    setSelectedType('');
    setName('');
    setDistance('');
    setBrand('');
    setModel('');
    setSpec('');
    setSelectedIcon('wrench');
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    setOpen(next);
  }

  function handleTypeSelect(type: string) {
    const spec_ = registry.find((s) => s.type === type);
    setSelectedType(type);
    if (spec_) {
      setName(spec_.label);
      setDistance(String(spec_.defaultRecommendedDistance / 1000));
    } else {
      setName('');
      setDistance('');
    }
  }

  function handleTypeNext() {
    if (!selectedType) return;
    setStep('details');
  }

  async function handleAdd() {
    const distanceKm = Number(distance);
    if (!name.trim() || !distanceKm || distanceKm <= 0) return;

    setLoading(true);
    try {
      let result: { success: boolean; error?: string };

      if (!selectedType || selectedType === 'custom') {
        // Custom component (legacy path)
        result = await addCustomComponentAction(bikeId, name, distanceKm, selectedIcon);
      } else {
        // Typed component from registry
        result = await addTypedComponentAction(bikeId, selectedType, {
          name,
          recommendedDistanceKm: distanceKm,
          brand: brand || null,
          model: model || null,
          spec: spec || null,
        });
      }

      if (result.success) {
        toast.success(`${name} added`);
        handleOpenChange(false);
      } else {
        toast.error("Failed to add component", { description: result.error });
      }
    } catch {
      toast.error("Failed to add component", { description: "An unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  }

  const isCustom = !selectedType || selectedType === 'custom';
  const canAdd = name.trim() && Number(distance) > 0;

  const dialogContent = (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>
          {step === 'type' ? 'Add Component' : isCustom ? 'Add Custom Component' : 'Add Component'}
        </DialogTitle>
        <DialogDescription>
          {step === 'type'
            ? 'Select the component type to track on this bike.'
            : 'Set the details for this component.'}
        </DialogDescription>
      </DialogHeader>

      {/* Step 1: Type selection */}
      {step === 'type' && (
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Component type</Label>
            <Select value={selectedType} onValueChange={handleTypeSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a component…" />
              </SelectTrigger>
              <SelectContent>
                {registry.map((spec_) => {
                  const alreadyAdded = spec_.unique && addedTypes.has(spec_.type);
                  return (
                    <SelectItem
                      key={spec_.type}
                      value={spec_.type}
                      disabled={alreadyAdded}
                      className={cn(alreadyAdded && "opacity-40")}
                    >
                      <span className="flex items-center gap-2">
                        {spec_.label}
                        {alreadyAdded && (
                          <Check className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </span>
                    </SelectItem>
                  );
                })}
                <SelectItem value="custom">Custom component</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Step 2: Details */}
      {step === 'details' && (
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="component-name">Component name</Label>
            <Input
              id="component-name"
              placeholder="e.g. Handlebar Tape"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="component-distance">
              Recommended replacement distance (km)
            </Label>
            <Input
              id="component-distance"
              type="number"
              min={1}
              placeholder="e.g. 5000"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
            />
          </div>
          {/* Extra details for typed components */}
          {!isCustom && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label htmlFor="component-brand">Brand</Label>
                  <Input
                    id="component-brand"
                    placeholder="e.g. Shimano"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="component-model">Model</Label>
                  <Input
                    id="component-model"
                    placeholder="e.g. 105"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="component-spec">Spec</Label>
                <Input
                  id="component-spec"
                  placeholder="e.g. 11-34T, 11sp"
                  value={spec}
                  onChange={(e) => setSpec(e.target.value)}
                />
              </div>
            </>
          )}
          {/* Icon picker for custom components */}
          {isCustom && (
            <div className="grid gap-2">
              <Label>Icon</Label>
              <div className="grid grid-cols-10 gap-1">
                {CUSTOM_ICON_OPTIONS.map(({ key, icon: IconComp }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedIcon(key)}
                    className={cn(
                      "flex items-center justify-center h-8 w-8 rounded-md transition-colors",
                      selectedIcon === key
                        ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background"
                        : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                    title={key}
                  >
                    <IconComp className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <DialogFooter className="flex-row justify-between sm:justify-between gap-2">
        <div className="flex gap-2">
          {step === 'details' && registry.length > 0 && !preselectedType && (
            <Button variant="outline" onClick={() => setStep('type')} disabled={loading}>
              Back
            </Button>
          )}
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
        </div>
        {step === 'type' ? (
          <Button onClick={handleTypeNext} disabled={!selectedType}>
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleAdd} disabled={loading || !canAdd}>
            {loading ? "Adding…" : "Add Component"}
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  );

  // Uncontrolled mode: include trigger button
  if (!isControlled) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Add component">
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        {dialogContent}
      </Dialog>
    );
  }

  // Controlled mode: no trigger
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {dialogContent}
    </Dialog>
  );
}
