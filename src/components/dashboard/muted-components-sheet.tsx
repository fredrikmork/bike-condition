"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { muteComponentAction } from "@/app/actions/components";
import type { Component } from "@/lib/supabase/types";

interface MutedComponentsSheetProps {
  components: Component[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function MutedComponentsSheet({
  components,
  open,
  onOpenChange,
}: MutedComponentsSheetProps) {
  const [unmuting, setUnmuting] = useState<string | null>(null);

  async function handleUnmute(component: Component) {
    setUnmuting(component.id);
    try {
      const result = await muteComponentAction(component.id, false);
      if (!result.success) {
        toast.error("Failed to unmute component", { description: result.error });
      }
    } catch {
      toast.error("Failed to unmute component");
    } finally {
      setUnmuting(null);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Hidden components</SheetTitle>
          <SheetDescription>
            These components are muted. They won&apos;t appear in the dashboard
            or trigger warnings. Unmute to start tracking them again.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {components.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hidden components.</p>
          ) : (
            components.map((component) => (
              <div
                key={component.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{component.name}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-3 shrink-0 h-7 text-xs"
                  disabled={unmuting === component.id}
                  onClick={() => handleUnmute(component)}
                >
                  <Bell className="h-3.5 w-3.5 mr-1.5" />
                  Unmute
                </Button>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
