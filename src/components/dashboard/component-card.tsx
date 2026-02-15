import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusIndicator } from "./status-indicator";
import {
  calculateComponentWear,
  formatDistance,
} from "@/lib/wear/calculator";
import type { Component } from "@/lib/supabase/types";

interface ComponentCardProps {
  component: Component;
}

export function ComponentCard({ component }: ComponentCardProps) {
  const wear = calculateComponentWear(component);
  const cappedPercentage = Math.min(wear.percentage, 100);

  const indicatorColor =
    wear.status === "critical"
      ? "bg-status-critical"
      : wear.status === "warning"
        ? "bg-status-warning"
        : "bg-status-healthy";

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium truncate">{component.name}</h4>
          <StatusIndicator status={wear.status} isOverdue={wear.isOverdue} />
        </div>

        <Progress
          value={cappedPercentage}
          className="h-2 mb-3"
          indicatorClassName={indicatorColor}
        />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {formatDistance(component.current_distance)} /{" "}
            {formatDistance(component.recommended_distance)}
          </span>
          <span>
            {wear.isOverdue
              ? "Replace now"
              : `${formatDistance(wear.remainingDistance)} left`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
