"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
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
import { cn } from "@/lib/utils";

interface ReplaceDialogProps {
  componentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReplace: (date: Date) => void;
}

export function ReplaceDialog({
  componentName,
  open,
  onOpenChange,
  onReplace,
}: ReplaceDialogProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

  function handleOpenChange(v: boolean) {
    if (v) setDate(new Date());
    onOpenChange(v);
  }

  function handleReplace() {
    onReplace(date);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Replace {componentName}</DialogTitle>
          <DialogDescription>
            Mark this component as replaced and start tracking a new one. Pick the date you
            installed the replacement.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 py-4">
          <Label htmlFor="replace-date">Replacement date</Label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleReplace}>Replace</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
