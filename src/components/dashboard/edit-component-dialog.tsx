"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Info } from "lucide-react";
import { useEffect } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { isContainerType } from "@/lib/components/containers";
import type { Component, LubeType } from "@/lib/supabase/types";
import { formatDistance, getSuggestedDistance, LUBE_LABELS } from "@/lib/wear/calculator";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  nickname: z.string().max(100).optional(),
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

/**
 * A container shows only the fields that mean something for it. The rest are not
 * merely hidden — they are dropped from validation too, because a rule on a
 * field the user cannot see fails with an error message they cannot read, and
 * the save just appears to do nothing.
 */
const containerSchema = schema.pick({ name: true, brand: true, model: true, notes: true });

type FormValues = z.infer<typeof schema>;

export type UpdateComponentData = {
  name: string;
  nickname: string | null;
  brand: string | null;
  model: string | null;
  spec: string | null;
  lube_type: LubeType | null;
  recommended_distance: number;
  notes: string | null;
};

interface EditComponentDialogProps {
  component: Component;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: UpdateComponentData) => void;
}

export function EditComponentDialog({
  component,
  open,
  onOpenChange,
  onSave,
}: EditComponentDialogProps) {
  const isContainer = isContainerType(component.type);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    // The container schema is a strict subset, so the resolver's value type is
    // narrower than the form's; the fields it drops are the ones a container never
    // submits, and `onSubmit` substitutes the stored values for them.
    resolver: zodResolver(
      isContainer ? containerSchema : schema
    ) as unknown as Resolver<FormValues>,
    defaultValues: {
      name: component.name,
      nickname: component.nickname ?? "",
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
      nickname: component.nickname ?? "",
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
  const isCustom = component.type === "custom";
  const suggestedM = getSuggestedDistance(component.type, lubeType ?? null);
  const suggestedKm = suggestedM ? Math.round(suggestedM / 1000) : null;

  function onSubmit(values: FormValues) {
    onSave({
      name: isCustom ? (values.name ?? component.name) : component.name,
      nickname: isContainer ? null : values.nickname?.trim() || null,
      brand: values.brand || null,
      model: values.model || null,
      spec: isContainer ? null : values.spec || null,
      lube_type: isContainer ? null : ((values.lube_type as LubeType) ?? null),
      // A container keeps whatever it was stored with (0) — it wears out nothing.
      recommended_distance: isContainer
        ? component.recommended_distance
        : values.recommended_distance_km * 1000,
      notes: values.notes || null,
    });
  }

  /** A form that refuses to submit must say why; silence reads as a broken button. */
  function onInvalid(formErrors: typeof errors) {
    const first = Object.values(formErrors).find((e) => e?.message)?.message;
    toast.error("Could not save", { description: first ?? "Check the highlighted fields." });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {component.name}</DialogTitle>
          <DialogDescription>
            {isContainer
              ? "Record the brand and model. The parts it holds are tracked separately."
              : "Update component details. Lube type affects the suggested replacement interval for chains."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="grid gap-4 py-2">
          {/* Name — custom components only */}
          {isCustom && (
            <div className="grid gap-1.5">
              <Label htmlFor="ec-name">Name</Label>
              <Input id="ec-name" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
          )}

          {/* Nickname — how you tell two of the same part apart when rotating.
              Not offered for containers: brand and model already identify those. */}
          {!isContainer && (
            <div className="grid gap-1.5">
              <Label htmlFor="ec-nickname">Nickname</Label>
              <Input
                id="ec-nickname"
                placeholder="e.g. Winter cassette"
                {...register("nickname")}
              />
              <p className="text-xs text-muted-foreground">
                Shown instead of the component name. Useful when you rotate several of the same part
                between bikes.
              </p>
            </div>
          )}

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
          {!isContainer && (
            <div className="grid gap-1.5">
              <Label htmlFor="ec-spec">
                Spec{" "}
                <span className="text-muted-foreground font-normal text-xs">
                  (full model string)
                </span>
              </Label>
              <Input id="ec-spec" placeholder="e.g. CN-HG701-11" {...register("spec")} />
            </div>
          )}

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
                  {(Object.entries(LUBE_LABELS) as [LubeType, string][]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Recommended distance — a container has none, so the field is gone
              entirely rather than hidden and still validated */}
          {!isContainer && (
            <div className="grid gap-1.5">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="ec-distance">
                  Recommended distance{" "}
                  <span className="text-muted-foreground font-normal text-xs">(km)</span>
                </Label>
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
                <p className="text-xs text-destructive">{errors.recommended_distance_km.message}</p>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="grid gap-1.5">
            <Label htmlFor="ec-notes">
              Notes <span className="text-muted-foreground font-normal text-xs">(optional)</span>
            </Label>
            <Textarea
              id="ec-notes"
              rows={2}
              placeholder="e.g. Changed with cassette"
              {...register("notes")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
