"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateComponentAction } from "@/app/actions/components";
import { getSuggestedDistance, LUBE_LABELS, formatDistance } from "@/lib/wear/calculator";
import type { Component, LubeType } from "@/lib/supabase/types";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  spec: z.string().max(200).optional(),
  lube_type: z.enum(["wet_lube", "dry_lube", "drip_wax", "hot_wax"]).optional(),
  recommended_distance_km: z
    .number({ error: "Enter a number" })
    .int()
    .positive("Distance must be greater than 0"),
  notes: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

interface EditComponentDialogProps {
  component: Component;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditComponentDialog({
  component,
  open,
  onOpenChange,
}: EditComponentDialogProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: component.name,
      brand: component.brand ?? "",
      model: component.model ?? "",
      spec: component.spec ?? "",
      lube_type: (component.lube_type as LubeType) ?? undefined,
      recommended_distance_km: Math.round(component.recommended_distance / 1000),
      notes: component.notes ?? "",
    },
  });

  // Reset form when component changes
  useEffect(() => {
    reset({
      name: component.name,
      brand: component.brand ?? "",
      model: component.model ?? "",
      spec: component.spec ?? "",
      lube_type: (component.lube_type as LubeType) ?? undefined,
      recommended_distance_km: Math.round(component.recommended_distance / 1000),
      notes: component.notes ?? "",
    });
  }, [component, reset]);

  const lubeType = watch("lube_type");
  const isChain = component.type === "chain";
  const suggestedM = getSuggestedDistance(component.type, lubeType ?? null);
  const suggestedKm = suggestedM ? Math.round(suggestedM / 1000) : null;

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const result = await updateComponentAction(component.id, {
        name: values.name,
        brand: values.brand || null,
        model: values.model || null,
        spec: values.spec || null,
        lube_type: (values.lube_type as LubeType) ?? null,
        recommended_distance: values.recommended_distance_km * 1000,
        notes: values.notes || null,
      });

      if (result.success) {
        toast.success(`${values.name} updated`);
        onOpenChange(false);
      } else {
        toast.error("Failed to update component", { description: result.error });
      }
    } catch {
      toast.error("Failed to update component", {
        description: "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {component.name}</DialogTitle>
          <DialogDescription>
            Update component details. Lube type affects the suggested replacement
            interval for chains.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-2">
          {/* Name */}
          <div className="grid gap-1.5">
            <Label htmlFor="ec-name">Name</Label>
            <Input id="ec-name" {...register("name")} />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Brand + Model */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="ec-brand">Brand</Label>
              <Input id="ec-brand" placeholder="Shimano" {...register("brand")} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ec-model">Model</Label>
              <Input id="ec-model" placeholder="Ultegra" {...register("model")} />
            </div>
          </div>

          {/* Spec */}
          <div className="grid gap-1.5">
            <Label htmlFor="ec-spec">
              Spec{" "}
              <span className="text-muted-foreground font-normal text-xs">
                (full model string)
              </span>
            </Label>
            <Input
              id="ec-spec"
              placeholder="e.g. CN-HG701-11"
              {...register("spec")}
            />
          </div>

          {/* Lube type — chain only */}
          {isChain && (
            <div className="grid gap-1.5">
              <Label>Lube type</Label>
              <Select
                value={lubeType ?? ""}
                onValueChange={(v) =>
                  setValue("lube_type", v as LubeType, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select lube type" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(LUBE_LABELS) as [LubeType, string][]).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Recommended distance */}
          <div className="grid gap-1.5">
            <Label htmlFor="ec-distance">
              Recommended distance{" "}
              <span className="text-muted-foreground font-normal text-xs">(km)</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="ec-distance"
                type="number"
                min={1}
                {...register("recommended_distance_km", { valueAsNumber: true })}
                className="flex-1"
              />
              {suggestedKm && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 text-xs"
                  onClick={() =>
                    setValue("recommended_distance_km", suggestedKm, {
                      shouldValidate: true,
                    })
                  }
                >
                  Use {formatDistance(suggestedKm * 1000)}
                </Button>
              )}
            </div>
            {suggestedKm && (
              <p className="text-xs text-muted-foreground">
                Suggested for {LUBE_LABELS[lubeType!]}: {formatDistance(suggestedKm * 1000)}
              </p>
            )}
            {errors.recommended_distance_km && (
              <p className="text-xs text-destructive">
                {errors.recommended_distance_km.message}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="grid gap-1.5">
            <Label htmlFor="ec-notes">
              Notes{" "}
              <span className="text-muted-foreground font-normal text-xs">
                (optional)
              </span>
            </Label>
            <Textarea
              id="ec-notes"
              rows={2}
              placeholder="e.g. Changed with cassette"
              {...register("notes")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
