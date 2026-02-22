import { ComponentCard } from "./component-card";
import { ComponentGroup } from "./component-group";
import { isComponentVisible } from "@/lib/components/visibility";
import { COMPONENT_GROUPS, GROUPED_TYPES } from "@/lib/components/groups";
import type { Component, BikeConfig } from "@/lib/supabase/types";

interface ComponentListProps {
  components: Component[];
  typesWithHistory?: Set<string>;
  bikeConfig?: BikeConfig | null;
  lastSync?: string | null;
  bikeId: string;
}

export function ComponentList({
  components,
  typesWithHistory = new Set(),
  bikeConfig = null,
  lastSync,
  bikeId,
}: ComponentListProps) {
  // Filter by visibility rules and mute state
  const visible = components.filter(
    (c) => !c.muted && isComponentVisible(c.type, bikeConfig)
  );

  if (visible.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No components tracked yet. Sync with Strava to get started.
      </p>
    );
  }

  const byType = new Map(visible.map((c) => [c.type, c]));

  return (
    <div className="space-y-3">
      {/* Grouped sections: Front Wheel, Rear Wheel, Drivetrain */}
      {COMPONENT_GROUPS.map((group) => {
        const groupComponents = group.types
          .map((t) => byType.get(t))
          .filter((c): c is Component => c !== undefined);

        if (groupComponents.length === 0) return null;

        return (
          <ComponentGroup
            key={group.id}
            group={group}
            components={groupComponents}
            typesWithHistory={typesWithHistory}
            lastSync={lastSync}
            bikeId={bikeId}
          />
        );
      })}

      {/* Ungrouped leftovers: bar_tape, cleats, brake_cables, custom, legacy */}
      {(() => {
        const ungrouped = visible.filter((c) => !GROUPED_TYPES.has(c.type));
        if (ungrouped.length === 0) return null;
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ungrouped.map((component) => (
              <ComponentCard
                key={component.id}
                component={component}
                hasHistory={typesWithHistory.has(component.type)}
                lastSync={lastSync}
              />
            ))}
          </div>
        );
      })()}
    </div>
  );
}
