"use client";

import { useState } from "react";
import { Settings2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ComponentList } from "./component-list";
import { AddComponentDialog } from "./add-component-dialog";
import { BikeConfigDialog } from "./bike-config-dialog";
import { formatDistance } from "@/lib/wear/calculator";
import { getBikeConfig } from "@/lib/components/visibility";
import type { BikeWithComponents } from "@/lib/supabase/types";

interface BikeDetailProps {
  bike: BikeWithComponents;
  typesWithHistory?: Set<string>;
  lastSync?: string | null;
}

export function BikeDetail({ bike, typesWithHistory = new Set(), lastSync }: BikeDetailProps) {
  const [configOpen, setConfigOpen] = useState(false);

  const subtitle = [bike.brand_name, bike.model_name].filter(Boolean).join(" ");
  const config = getBikeConfig(bike);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{bike.name}</CardTitle>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {bike.is_primary && <Badge variant="secondary">Primary</Badge>}
              <Badge variant="outline">{formatDistance(bike.total_distance)}</Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setConfigOpen(true)}
                title={bike.config_complete ? "Re-configure bike" : "Configure bike"}
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Config prompt — shown only when not yet configured */}
          {!bike.config_complete && (
            <button
              onClick={() => setConfigOpen(true)}
              className="w-full mb-4 flex items-start gap-3 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-3 text-left transition-colors hover:border-muted-foreground/50 hover:bg-muted/50"
            >
              <Settings2 className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Set up {bike.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure shifting, brakes, and tire system to see the right
                  components and replacement intervals.
                </p>
              </div>
            </button>
          )}

          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Components</h3>
            <AddComponentDialog bikeId={bike.id} />
          </div>
          <ComponentList
            components={bike.components}
            typesWithHistory={typesWithHistory}
            bikeConfig={config}
            lastSync={lastSync}
          />
        </CardContent>
      </Card>

      <BikeConfigDialog
        bike={bike}
        open={configOpen}
        onOpenChange={setConfigOpen}
      />
    </>
  );
}
