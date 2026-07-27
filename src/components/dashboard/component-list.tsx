import { isContainerType } from "@/lib/components/containers";
import { COMPONENT_GROUPS, GROUPED_TYPES } from "@/lib/components/groups";
import type { AnyIcon } from "@/lib/components/icons";
import { isComponentVisible } from "@/lib/components/visibility";
import type { BikeConfig, Component } from "@/lib/supabase/types";
import { ComponentGroup } from "./component-group";
import { SyncNudge } from "./sync-nudge";

interface ComponentListProps {
  components: Component[];
  typesWithHistory?: Set<string>;
  bikeConfig?: BikeConfig | null;
  lastSync?: string | null;
  hasVirtualRides?: boolean;
  /** Shown as the Frame group's subtitle — the frame is the bike */
  bikeLabel?: string | null;
  /** The bike's silhouette icon, shown on the Frame group */
  bikeIcon?: AnyIcon | null;
  /** Retired bike — values only, no edit/replace/delete actions */
  readOnly?: boolean;
}

export function ComponentList({
  components,
  typesWithHistory = new Set(),
  bikeConfig = null,
  lastSync,
  hasVirtualRides = false,
  bikeLabel = null,
  bikeIcon = null,
  readOnly = false,
}: ComponentListProps) {
  // Filter by visibility rules and mute state
  const visible = components.filter((c) => !c.muted && isComponentVisible(c.type, bikeConfig));

  // Containers hold parts but are not parts themselves — a wheel with nothing
  // on it is an empty group, not a component to show.
  const wearing = visible.filter((c) => !isContainerType(c.type));

  if (wearing.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        {readOnly
          ? "No components were tracked on this bike."
          : "No components tracked yet. Sync with Strava to get started."}
      </p>
    );
  }

  const byType = new Map(visible.map((c) => [c.type, c]));

  const needsSyncCount =
    lastSync && !readOnly
      ? wearing.filter((c) => new Date(c.installed_at) > new Date(lastSync)).length
      : 0;

  return (
    <div className="space-y-3">
      {needsSyncCount > 0 && <SyncNudge count={needsSyncCount} />}
      {COMPONENT_GROUPS.map((group) => {
        const claimed = group.types
          .map((t) => byType.get(t))
          .filter((c): c is Component => c !== undefined);

        // The catch-all group also takes anything no group named: custom parts,
        // legacy types, and anything added by a future sync we don't know yet.
        const groupComponents = group.isCatchAll
          ? [...claimed, ...wearing.filter((c) => !GROUPED_TYPES.has(c.type))]
          : claimed;

        if (groupComponents.length === 0) return null;

        const container = group.containerType ? (byType.get(group.containerType) ?? null) : null;

        return (
          <ComponentGroup
            key={group.id}
            group={group}
            container={container}
            components={groupComponents}
            typesWithHistory={typesWithHistory}
            lastSync={lastSync}
            hasVirtualRides={hasVirtualRides}
            subtitle={group.id === "frame" ? bikeLabel : null}
            bikeIcon={group.id === "frame" ? bikeIcon : null}
            readOnly={readOnly}
          />
        );
      })}
    </div>
  );
}
