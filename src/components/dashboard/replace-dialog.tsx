"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { replaceComponentAction } from "@/app/actions/replace";

interface ReplaceDialogProps {
  componentId: string;
  componentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReplaceDialog({
  componentId,
  componentName,
  open,
  onOpenChange,
}: ReplaceDialogProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);

  async function handleReplace() {
    setLoading(true);
    try {
      const result = await replaceComponentAction(
        componentId,
        date.toISOString()
      );
      if (result.success) {
        toast.success(`${componentName} replaced`, {
          description: `Replacement date: ${format(date, "PPP")}`,
        });
        onOpenChange(false);
      } else {
        toast.error("Failed to replace component", {
          description: result.error,
        });
      }
    } catch {
      toast.error("Failed to replace component", {
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
          <DialogTitle>Replace {componentName}</DialogTitle>
          <DialogDescription>
            Mark this component as replaced and start tracking a new one. Pick
            the date you installed the replacement.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 py-4">
          <Label htmlFor="replace-date">Replacement date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="replace-date"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                disabled={{ after: new Date() }}
                defaultMonth={date}
              />
            </PopoverContent>
          </Popover>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleReplace} disabled={loading}>
            {loading ? "Replacing..." : "Replace"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
