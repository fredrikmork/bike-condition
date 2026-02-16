import { ComponentCard } from "./component-card";
import { getComponentCategory, CATEGORY_ORDER } from "@/lib/components/categories";
import type { Component } from "@/lib/supabase/types";

interface ComponentListProps {
  components: Component[];
}

export function ComponentList({ components }: ComponentListProps) {
  if (components.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No components tracked yet. Sync with Strava to get started.
      </p>
    );
  }

  // Group components by category
  const grouped = new Map<string, Component[]>();
  for (const component of components) {
    const category = getComponentCategory(component.type);
    const list = grouped.get(category) || [];
    list.push(component);
    grouped.set(category, list);
  }

  return (
    <div className="space-y-5">
      {CATEGORY_ORDER.filter((cat) => grouped.has(cat)).map((category) => (
        <div key={category}>
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
            {category}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {grouped.get(category)!.map((component) => (
              <ComponentCard key={component.id} component={component} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
