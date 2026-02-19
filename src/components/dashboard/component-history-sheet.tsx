"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { getComponentHistoryAction } from "@/app/actions/components";
import { formatDistance, LUBE_LABELS } from "@/lib/wear/calculator";
import type { Component, LubeType } from "@/lib/supabase/types";

interface ComponentHistorySheetProps {
  bikeId: string;
  componentType: string;
  componentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ComponentHistorySheet({
  bikeId,
  componentType,
  componentName,
  open,
  onOpenChange,
}: ComponentHistorySheetProps) {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Component[]>([]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function fetchHistory() {
      setLoading(true);
      try {
        const result = await getComponentHistoryAction(bikeId, componentType);
        if (!cancelled && result.success && result.history) {
          setHistory(result.history);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchHistory();

    return () => { cancelled = true; };
  }, [open, bikeId, componentType]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{componentName} — History</SheetTitle>
          <SheetDescription>
            Previously retired versions of this component.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No history found.
            </p>
          ) : (
            <ol className="relative border-l border-border pl-4 space-y-6">
              {history.map((entry) => (
                <HistoryEntry key={entry.id} entry={entry} />
              ))}
            </ol>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function HistoryEntry({ entry }: { entry: Component }) {
  const installedDate = format(new Date(entry.installed_at), "d MMM yyyy");
  const replacedDate = entry.replaced_at
    ? format(new Date(entry.replaced_at), "d MMM yyyy")
    : null;

  const specParts = [entry.brand, entry.model, entry.spec].filter(Boolean);

  return (
    <li className="relative">
      {/* Timeline dot */}
      <span className="absolute -left-[1.35rem] top-1 h-2.5 w-2.5 rounded-full border-2 border-border bg-background" />

      <div className="grid gap-1">
        {/* Date range */}
        <p className="text-xs text-muted-foreground">
          {installedDate}
          {replacedDate && <> → {replacedDate}</>}
        </p>

        {/* Spec */}
        {specParts.length > 0 && (
          <p className="text-sm font-medium">{specParts.join(" ")}</p>
        )}
        {specParts.length === 0 && (
          <p className="text-sm text-muted-foreground italic">No spec recorded</p>
        )}

        {/* Distance at retirement */}
        <p className="text-xs text-muted-foreground">
          {formatDistance(entry.current_distance)} ridden
        </p>

        {/* Badges */}
        <div className="flex flex-wrap gap-1 mt-0.5">
          {entry.lube_type && (
            <Badge variant="secondary" className="text-[10px]">
              {LUBE_LABELS[entry.lube_type as LubeType]}
            </Badge>
          )}
          {entry.notes && (
            <Badge variant="outline" className="text-[10px] font-normal">
              {entry.notes}
            </Badge>
          )}
        </div>
      </div>
    </li>
  );
}
