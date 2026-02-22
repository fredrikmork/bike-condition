"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addComponentAction } from "@/app/actions/components";
import { getBikeConfig } from "@/lib/components/visibility";
import { getAvailableComponentTypes } from "@/lib/components/defaults";
import { getComponentCategory, CATEGORY_ORDER } from "@/lib/components/categories";
import type { BikeWithComponents } from "@/lib/supabase/types";

interface AddComponentDialogProps {
  bike: BikeWithComponents;
}

export function AddComponentDialog({ bike }: AddComponentDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [distance, setDistance] = useState("");
  const [loading, setLoading] = useState(false);

  const config = getBikeConfig(bike);
  const availableTypes = getAvailableComponentTypes(config, bike.components);

  const grouped = CATEGORY_ORDER.reduce<Record<string, typeof availableTypes>>(
    (acc, cat) => {
      const items = availableTypes.filter((t) => getComponentCategory(t.type) === cat);
      if (items.length > 0) acc[cat] = items;
      return acc;
    },
    {}
  );

  function handleTypeChange(value: string) {
    setSelectedType(value);
    const spec = availableTypes.find((t) => t.type === value);
    setDistance(spec ? String(spec.recommended_distance / 1000) : "");
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setSelectedType("");
      setDistance("");
    }
  }

  async function handleAdd() {
    const distanceKm = Number(distance);
    if (!selectedType || distanceKm <= 0) return;

    const name = availableTypes.find((t) => t.type === selectedType)?.name ?? selectedType;

    setLoading(true);
    try {
      const result = await addComponentAction(bike.id, {
        type: selectedType,
        name,
        recommendedDistanceKm: distanceKm,
      });
      if (result.success) {
        toast.success(`${name} added`);
        handleOpenChange(false);
      } else {
        toast.error("Failed to add component", { description: result.error });
      }
    } catch {
      toast.error("Failed to add component", {
        description: "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = !!selectedType && !!distance && Number(distance) > 0;

  const isEmpty = availableTypes.length === 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Add component">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Component</DialogTitle>
          <DialogDescription>
            Choose a component type to track on this bike.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {!config ? (
            <p className="text-sm text-muted-foreground">
              Configure this bike first to see which components to track.
            </p>
          ) : isEmpty ? (
            <p className="text-sm text-muted-foreground">
              All components for this bike are already being tracked.
            </p>
          ) : (
            <>
              <div className="grid gap-2">
                <Label htmlFor="component-type">Component type</Label>
                <Select value={selectedType} onValueChange={handleTypeChange}>
                  <SelectTrigger id="component-type">
                    <SelectValue placeholder="Select a component…" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(grouped).map(([category, items]) => (
                      <SelectGroup key={category}>
                        <SelectLabel>{category}</SelectLabel>
                        {items.map((spec) => (
                          <SelectItem key={spec.type} value={spec.type}>
                            {spec.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedType && (
                <div className="grid gap-2">
                  <Label htmlFor="component-distance">
                    Recommended replacement distance (km)
                  </Label>
                  <Input
                    id="component-distance"
                    type="number"
                    min={1}
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          {!isEmpty && config && (
            <Button onClick={handleAdd} disabled={loading || !canSubmit}>
              {loading ? "Adding..." : "Add Component"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
