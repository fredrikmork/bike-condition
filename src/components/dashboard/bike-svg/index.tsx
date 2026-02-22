"use client";

import { Settings2 } from "lucide-react";
import { useHoverStore } from "@/stores/hover-store";
import { getRegistryForBike } from "@/lib/bikes/component-registry";
import { getBikeConfig } from "@/lib/components/visibility";
import { calculateComponentWear } from "@/lib/wear/calculator";
import { STRAVA_FRAME_TYPE_MAP } from "@/lib/bikes/types";
import { RoadBikeSvg } from "./road-bike";
import type { HotspotData } from "./types";
import type { BikeWithComponents } from "@/lib/supabase/types";
import type { BikeType } from "@/lib/bikes/types";

interface BikeSvgProps {
  bike: BikeWithComponents;
  onAddComponent: (type: string) => void;
  onOpenConfig: () => void;
}

export function BikeSvg({ bike, onAddComponent, onOpenConfig }: BikeSvgProps) {
  const { hoveredType, setHoveredType } = useHoverStore();

  // Resolve bike type: DB value takes priority, fall back to Strava frame_type
  const bikeType: BikeType | null =
    bike.bike_type ??
    (bike.frame_type != null ? (STRAVA_FRAME_TYPE_MAP[bike.frame_type] ?? null) : null);

  // No bike type set → prompt to configure
  if (!bikeType) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[240px] gap-3 text-center px-6">
        <svg viewBox="0 0 100 60" className="w-20 h-14 mx-auto text-muted-foreground/30">
          <circle cx={20} cy={45} r={14} fill="none" stroke="currentColor" strokeWidth={2} />
          <circle cx={80} cy={45} r={14} fill="none" stroke="currentColor" strokeWidth={2} />
          <line x1={20} y1={45} x2={50} y2={20} stroke="currentColor" strokeWidth={2} />
          <line x1={50} y1={20} x2={80} y2={45} stroke="currentColor" strokeWidth={2} />
          <line x1={50} y1={20} x2={50} y2={45} stroke="currentColor" strokeWidth={2} />
        </svg>
        <p className="text-sm font-medium text-muted-foreground">Bike type not set</p>
        <p className="text-xs text-muted-foreground/60">Configure your bike to see the interactive diagram</p>
        <button
          onClick={onOpenConfig}
          className="flex items-center gap-1.5 text-xs text-primary hover:underline mt-1"
        >
          <Settings2 className="h-3.5 w-3.5" />
          Configure bike
        </button>
      </div>
    );
  }

  const config    = getBikeConfig(bike);
  const registry  = getRegistryForBike(bikeType, config);
  const compMap   = new Map(bike.components.map((c) => [c.type, c]));

  const hotspots: HotspotData[] = registry
    .map((spec) => {
      const component = compMap.get(spec.type);
      if (component) {
        const wear = calculateComponentWear(component);
        return { type: spec.type, svgId: spec.svgId, label: spec.label, wearStatus: wear.status, wearPercentage: wear.percentage };
      }
      if (spec.required) {
        return { type: spec.type, svgId: spec.svgId, label: spec.label, wearStatus: "missing" as const, wearPercentage: 0 };
      }
      return null;
    })
    .filter((h): h is HotspotData => h !== null);

  const svgProps = {
    hotspots,
    hoveredType,
    onHotspotHover: setHoveredType,
    onGhostClick: onAddComponent,
  };

  // Only road bike for now; other types will be added later
  switch (bikeType) {
    case "road":  return <RoadBikeSvg {...svgProps} />;
    default:      return <RoadBikeSvg {...svgProps} />;  // fallback until other schematics are drawn
  }
}
