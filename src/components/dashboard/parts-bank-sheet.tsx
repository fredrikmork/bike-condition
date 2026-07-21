"use client";

import { Bike, PackageOpen } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { mountComponentAction } from "@/app/actions/components";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useBikeStore } from "@/lib/stores/bike-store";
import type { Component } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { calculateComponentWear, formatDistance } from "@/lib/wear/calculator";

interface PartsBankSheetProps {
  components: Component[];
}

export function PartsBankSheet({ components }: PartsBankSheetProps) {
  const { partsBankOpen, setPartsBankOpen, bikes } = useBikeStore();
  const [, startTransition] = useTransition();
  const [optimisticParts, removeOptimistic] = useOptimistic(
    components,
    (state: Component[], id: string) => state.filter((c) => c.id !== id)
  );

  function handleMount(part: Component, bikeId: string, bikeName: string) {
    startTransition(async () => {
      removeOptimistic(part.id);
      try {
        const result = await mountComponentAction(part.id, bikeId);
        if (result.success) {
          toast.success(`${part.nickname ?? part.name} mounted on ${bikeName}`, {
            description: result.displacedName
              ? `${result.displacedName} went to the parts bank`
              : undefined,
          });
        } else {
          toast.error("Failed to mount component", { description: result.error });
        }
      } catch {
        toast.error("Failed to mount component");
      }
    });
  }

  return (
    <Sheet open={partsBankOpen} onOpenChange={setPartsBankOpen}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Parts bank</SheetTitle>
          <SheetDescription>
            Parts you have taken off a bike. They keep their accumulated wear and stop ageing until
            you mount them again.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {optimisticParts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No parts in the bank. Use &ldquo;Remove to bank&rdquo; on a component to store it
              here.
            </p>
          ) : (
            optimisticParts.map((part) => {
              const wear = calculateComponentWear(part);
              const indicatorColor =
                wear.status === "critical"
                  ? "bg-status-critical"
                  : wear.status === "warning"
                    ? "bg-status-warning"
                    : "bg-status-healthy";

              return (
                <div key={part.id} className="rounded-lg border px-3 py-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{part.nickname ?? part.name}</p>
                      {part.nickname && (
                        <p className="truncate text-xs text-muted-foreground">{part.name}</p>
                      )}
                      {(part.brand || part.model) && (
                        <p className="truncate text-xs text-muted-foreground">
                          {[part.brand, part.model].filter(Boolean).join(" ")}
                        </p>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 shrink-0 text-xs"
                          disabled={bikes.length === 0}
                        >
                          <Bike className="mr-1.5 h-3.5 w-3.5" />
                          Mount on
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {bikes.map((b) => (
                          <DropdownMenuItem
                            key={b.id}
                            onClick={() => handleMount(part, b.id, b.name)}
                          >
                            {b.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <Progress
                    value={Math.min(wear.percentage, 100)}
                    className="mt-2.5 h-1.5"
                    indicatorClassName={indicatorColor}
                  />
                  <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {formatDistance(part.current_distance ?? 0)} /{" "}
                      {formatDistance(part.recommended_distance)}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-normal",
                        wear.isOverdue && "border-status-critical/50 text-status-critical"
                      )}
                    >
                      {wear.isOverdue ? "Worn out" : `${Math.round(wear.percentage)}%`}
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Sidebar entry that opens the bank. */
export function PartsBankTrigger({ count }: { count: number }) {
  const { setPartsBankOpen } = useBikeStore();

  return (
    <button
      onClick={() => setPartsBankOpen(true)}
      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
    >
      <PackageOpen className="h-4 w-4 shrink-0" />
      <span>Parts bank ({count})</span>
    </button>
  );
}
