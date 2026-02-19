import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ComponentList } from "./component-list";
import { AddComponentDialog } from "./add-component-dialog";
import { formatDistance } from "@/lib/wear/calculator";
import type { BikeWithComponents } from "@/lib/supabase/types";

interface BikeDetailProps {
  bike: BikeWithComponents;
  typesWithHistory?: Set<string>;
}

export function BikeDetail({ bike, typesWithHistory = new Set() }: BikeDetailProps) {
  const subtitle = [bike.brand_name, bike.model_name]
    .filter(Boolean)
    .join(" ");

  return (
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
            <Badge variant="outline">
              {formatDistance(bike.total_distance)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Components</h3>
          <AddComponentDialog bikeId={bike.id} />
        </div>
        <ComponentList components={bike.components} typesWithHistory={typesWithHistory} />
      </CardContent>
    </Card>
  );
}
