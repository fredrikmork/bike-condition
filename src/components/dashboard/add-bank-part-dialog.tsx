"use client";

import { Info, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { addComponentToBankAction } from "@/app/actions/components";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CATEGORY_ORDER, getComponentCategory } from "@/lib/components/categories";
import { ALL_ADDABLE_COMPONENTS } from "@/lib/components/defaults";
import { CUSTOM_ICON_OPTIONS } from "@/lib/components/icons";
import { cn } from "@/lib/utils";

/**
 * Add a spare part straight into the parts bank. Unlike the bike-scoped add
 * dialog, there is no bike config to narrow the type list, so it offers every
 * wearing part type plus a custom option.
 */
export function AddBankPartDialog() {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [customName, setCustomName] = useState("");
  const [distance, setDistance] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("wrench");
  const [loading, setLoading] = useState(false);

  const grouped = CATEGORY_ORDER.reduce<Record<string, typeof ALL_ADDABLE_COMPONENTS>>(
    (acc, cat) => {
      const items = ALL_ADDABLE_COMPONENTS.filter((t) => getComponentCategory(t.type) === cat);
      if (items.length > 0) acc[cat] = items;
      return acc;
    },
    {}
  );

  const isCustom = selectedType === "custom";

  function handleTypeChange(value: string) {
    setSelectedType(value);
    if (value !== "custom") {
      const spec = ALL_ADDABLE_COMPONENTS.find((t) => t.type === value);
      setDistance(spec ? String(spec.recommended_distance / 1000) : "");
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
    if (!selectedType || distanceKm <= 0) return;
    if (isCustom && !customName.trim()) return;

    const name = isCustom
      ? customName.trim()
      : (ALL_ADDABLE_COMPONENTS.find((t) => t.type === selectedType)?.name ?? selectedType);

    setLoading(true);
    try {
      const result = await addComponentToBankAction({
        type: selectedType,
        name,
        recommendedDistanceKm: distanceKm,
        icon: isCustom ? selectedIcon : null,
      });
      if (result.success) {
        toast.success(`${name} added to the parts bank`);
        handleOpenChange(false);
      } else {
        toast.error("Failed to add part", { description: result.error });
      }
    } catch {
      toast.error("Failed to add part", {
        description: "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  }

  const canSubmit =
    !!selectedType && !!distance && Number(distance) > 0 && (!isCustom || !!customName.trim());

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-accent hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
          Add component
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add part to bank</DialogTitle>
          <DialogDescription>
            Add a spare part to the bank. It carries no wear and starts ageing only once you mount
            it on a bike.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Type selector */}
          <div className="grid gap-2">
            <Label htmlFor="bank-part-type">Part type</Label>
            <Select value={selectedType} onValueChange={handleTypeChange}>
              <SelectTrigger id="bank-part-type">
                <SelectValue placeholder="Select a part…" />
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
                <SelectSeparator />
                <SelectItem value="custom">Custom part</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Name — custom only */}
          {isCustom && (
            <div className="grid gap-2">
              <Label htmlFor="bank-part-name">Name</Label>
              <Input
                id="bank-part-name"
                placeholder="e.g. Saddle"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            </div>
          )}

          {/* Distance — once a type is selected */}
          {selectedType && (
            <div className="grid gap-2">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="bank-part-distance">Recommended replacement distance (km)</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-default shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p>
                      These intervals are estimates based on average road cycling conditions. Always
                      physically inspect your components — use this app as a guideline only.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="bank-part-distance"
                type="number"
                min={1}
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
              />
            </div>
          )}

          {/* Icon picker — custom only */}
          {isCustom && (
            <div className="grid gap-2">
              <Label>Icon</Label>
              <div className="grid grid-cols-8 gap-1 sm:grid-cols-10">
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
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={loading || !canSubmit}>
            {loading ? "Adding..." : "Add part"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
