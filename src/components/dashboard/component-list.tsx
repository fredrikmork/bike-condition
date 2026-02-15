import { ComponentCard } from "./component-card";
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

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {components.map((component) => (
        <ComponentCard key={component.id} component={component} />
      ))}
    </div>
  );
}
