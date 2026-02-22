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
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addComponentAction } from "@/app/actions/components";
import { CUSTOM_ICON_OPTIONS } from "@/lib/components/icons";
import { getBikeConfig } from "@/lib/components/visibility";
import { getAvailableComponentTypes } from "@/lib/components/defaults";
import { getComponentCategory, CATEGORY_ORDER } from "@/lib/components/categories";
import { cn } from "@/lib/utils";
import type { BikeWithComponents } from "@/lib/supabase/types";

interface AddComponentDialogProps {
  bike: BikeWithComponents;
}

export function AddComponentDialog({ bike }: AddComponentDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [customName, setCustomName] = useState("");
  const [distance, setDistance] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("wrench");
  const [loading, setLoading] = useState(false);

  const config = getBikeConfig(bike);
  const availableTypes = getAvailableComponentTypes(config, bike.components);

  // Group available types by category
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
    if (value !== "custom") {
      const spec = availableTypes.find((t) => t.type === value);
      if (spec) setDistance(String(spec.recommended_distance / 1000));
      else setDistance("");
    } else {
      setDistance("");
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setSelectedType("");
      setCustomName("");
      setDistance("");
      setSelectedIcon("wrench");
    }
  }

  async function handleAdd() {
    const distanceKm = Number(distance);
    if (!selectedType || !distanceKm || distanceKm <= 0) return;
    if (selectedType === "custom" && !customName.trim()) return;

    const name =
      selectedType === "custom"
        ? customName.trim()
        : (availableTypes.find((t) => t.type === selectedType)?.name ?? customName.trim());

    setLoading(true);
    try {
      const result = await addComponentAction(bike.id, {
        type: selectedType,
        name,
        recommendedDistanceKm: distanceKm,
        icon: selectedType === "custom" ? selectedIcon : null,
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

  const canSubmit =
    !!selectedType &&
    !!distance &&
    Number(distance) > 0 &&
    (selectedType !== "custom" || !!customName.trim());

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
          {/* Component type selector */}
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
                {availableTypes.length > 0 && <SelectSeparator />}
                <SelectItem value="custom">Custom component</SelectItem>
              </SelectContent>
            </Select>
            {!config && (
              <p className="text-xs text-muted-foreground">
                Configure this bike first to see recommended components.
              </p>
            )}
          </div>

          {/* Custom name — only for custom type */}
          {selectedType === "custom" && (
            <div className="grid gap-2">
              <Label htmlFor="component-name">Component name</Label>
              <Input
                id="component-name"
                placeholder="e.g. Handlebar Tape"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            </div>
          )}

          {/* Distance — shown once a type is selected */}
          {selectedType !== "" && (
            <div className="grid gap-2">
              <Label htmlFor="component-distance">
                Recommended replacement distance (km)
              </Label>
              <Input
                id="component-distance"
                type="number"
                min={1}
                placeholder="e.g. 3000"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
              />
            </div>
          )}

          {/* Icon picker — only for custom type */}
          {selectedType === "custom" && (
            <div className="grid gap-2">
              <Label>Icon</Label>
              <div className="grid grid-cols-10 gap-1">
                {CUSTOM_ICON_OPTIONS.map(({ key, icon: IconComp }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedIcon(key)}
                    aria-label={`Select ${key} icon`}
                    aria-pressed={selectedIcon === key}
                    className={cn(
                      "flex cursor-pointer items-center justify-center h-8 w-8 rounded-md transition-colors",
                      selectedIcon === key
                        ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background"
                        : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <IconComp className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={loading || !canSubmit}>
            {loading ? "Adding..." : "Add Component"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
