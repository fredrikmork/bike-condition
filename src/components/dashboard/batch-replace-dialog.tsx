"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { replaceComponentAction } from "@/app/actions/replace";
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
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ComponentGroupDef } from "@/lib/components/groups";
import type { Component } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

interface BatchReplaceDialogProps {
  group: ComponentGroupDef;
  components: Component[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function BatchReplaceDialog({
  group,
  components,
  open,
  onOpenChange,
}: BatchReplaceDialogProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set(components.map((c) => c.id)));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setChecked(new Set(components.map((c) => c.id)));
  }, [components]);

  function toggleComponent(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleReplace() {
    const selected = components.filter((c) => checked.has(c.id));
    if (selected.length === 0) return;

    setLoading(true);
    try {
      const results = await Promise.all(
        selected.map((c) => replaceComponentAction(c.id, date.toISOString()))
      );

      const failures = results.filter((r) => !r.success);
      const successes = results.filter((r) => r.success);

      if (successes.length > 0) {
        toast.success(
          successes.length === 1
            ? `${selected.find((c) => results[selected.indexOf(c)].success)?.name ?? "Component"} replaced`
            : `${successes.length} components replaced`,
          { description: `Replacement date: ${format(date, "PPP")}` }
        );
      }

      if (failures.length > 0) {
        toast.error(`${failures.length} component(s) failed to replace`, {
          description: failures[0].error,
        });
      }

      if (failures.length === 0) {
        onOpenChange(false);
      }
    } catch {
      toast.error("Failed to replace components", {
        description: "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  }

  const title = group.id === "front_wheel" ? "Replace Front Wheel" : "Replace Rear Wheel";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Select the components you replaced. They will all be reset to 0 km with the same
            installation date.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Component checklist */}
          <div className="space-y-2">
            <Label>Components to replace</Label>
            {components.map((component) => (
              <label
                key={component.id}
                className="flex items-center gap-3 rounded-md border px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={checked.has(component.id)}
                  onChange={() => toggleComponent(component.id)}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-sm">{component.name}</span>
              </label>
            ))}
          </div>

          {/* Date picker */}
          <div className="grid gap-2">
            <Label htmlFor="batch-replace-date">Replacement date</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="batch-replace-date"
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    if (d) {
                      setDate(d);
                      setCalendarOpen(false);
                    }
                  }}
                  captionLayout="dropdown"
                  disabled={{ after: new Date() }}
                  defaultMonth={date}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleReplace} disabled={loading || checked.size === 0}>
            {loading
              ? "Replacing…"
              : `Replace ${checked.size} component${checked.size !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
