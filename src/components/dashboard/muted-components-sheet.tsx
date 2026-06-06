"use client";

import { Bell } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { muteComponentAction } from "@/app/actions/components";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  const [, startTransition] = useTransition();
  const [optimisticComponents, removeOptimistic] = useOptimistic(
    components,
    (state: Component[], id: string) => state.filter((c) => c.id !== id)
  );

  function handleUnmute(component: Component) {
    startTransition(async () => {
      removeOptimistic(component.id);
      try {
        const result = await muteComponentAction(component.id, false);
        if (!result.success) {
          toast.error("Failed to unmute component", { description: result.error });
        } else {
          toast.success(`${component.name} unmuted`);
        }
      } catch {
        toast.error("Failed to unmute component");
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Hidden components</SheetTitle>
          <SheetDescription>
            These components are muted. They won&apos;t appear in the dashboard or trigger warnings.
            Unmute to start tracking them again.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {optimisticComponents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hidden components.</p>
          ) : (
            optimisticComponents.map((component) => (
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
