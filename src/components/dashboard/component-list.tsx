import { ComponentCard } from "./component-card";
import { getComponentCategory, CATEGORY_ORDER } from "@/lib/components/categories";
import { COMPONENT_FAMILIES, FAMILY_TYPES } from "@/lib/components/families";
import { isComponentVisible } from "@/lib/components/visibility";
import type { Component, BikeConfig } from "@/lib/supabase/types";

interface ComponentListProps {
  components: Component[];
  typesWithHistory?: Set<string>;
  bikeConfig?: BikeConfig | null;
}

export function ComponentList({
  components,
  typesWithHistory = new Set(),
  bikeConfig = null,
}: ComponentListProps) {
  // Filter by visibility rules
  const visible = components.filter((c) => isComponentVisible(c.type, bikeConfig));

  if (visible.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No components tracked yet. Sync with Strava to get started.
      </p>
    );
  }

  // Group by category
  const grouped = new Map<string, Component[]>();
  for (const component of visible) {
    const category = getComponentCategory(component.type);
    const list = grouped.get(category) || [];
    list.push(component);
    grouped.set(category, list);
  }

  return (
    <div className="space-y-5">
      {CATEGORY_ORDER.filter((cat) => grouped.has(cat)).map((category) => {
        const categoryComponents = grouped.get(category)!;
        const rendered = renderWithFamilies(categoryComponents, typesWithHistory);

        return (
          <div key={category}>
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              {category}
            </h3>
            <div className="space-y-3">{rendered}</div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Renders a category's components, pairing front/rear family members,
 * and rendering the rest as a solo grid.
 */
function renderWithFamilies(
  components: Component[],
  typesWithHistory: Set<string>
) {
  const byType = new Map(components.map((c) => [c.type, c]));
  const rendered: React.ReactNode[] = [];
  const usedIds = new Set<string>();

  // Render paired families first
  for (const family of COMPONENT_FAMILIES) {
    const front = byType.get(family.frontType);
    const rear = byType.get(family.rearType);

    if (front && rear) {
      usedIds.add(front.id);
      usedIds.add(rear.id);
      rendered.push(
        <div key={`family-${family.frontType}`}>
          <p className="text-xs text-muted-foreground/70 mb-1.5 ml-0.5">
            {family.label}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <ComponentCard
              component={front}
              hasHistory={typesWithHistory.has(front.type)}
            />
            <ComponentCard
              component={rear}
              hasHistory={typesWithHistory.has(rear.type)}
            />
          </div>
        </div>
      );
    }
  }

  // Render solo components (not part of a complete pair)
  const solos = components.filter((c) => !usedIds.has(c.id));

  // Family singles (one half of a pair is missing) render individually
  const familySingles = solos.filter((c) => FAMILY_TYPES.has(c.type));
  const nonFamily = solos.filter((c) => !FAMILY_TYPES.has(c.type));

  const grid = [...familySingles, ...nonFamily];
  if (grid.length > 0) {
    rendered.push(
      <div key="solo-grid" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {grid.map((component) => (
          <ComponentCard
            key={component.id}
            component={component}
            hasHistory={typesWithHistory.has(component.type)}
          />
        ))}
      </div>
    );
  }

  return rendered;
}
