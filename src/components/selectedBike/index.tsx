import type { BikeWithComponents, Component } from "@/lib/supabase/types";
import {
  calculateComponentWear,
  formatDistance,
  type WearStatus,
} from "@/lib/wear/calculator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Props {
  bike: BikeWithComponents;
}

export function SelectedBike({ bike }: Props) {
  const bikeType =
    bike.frame_type === 3
      ? "Road bike"
      : bike.frame_type === 2
        ? "Gravel/Cyclocross"
        : bike.frame_type === 1
          ? "Mountain bike"
          : "Bicycle";

  return (
    <Card className="border-0 bg-dark-grey-4 text-white">
      <CardHeader className="pb-3">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
          <div className="flex items-center gap-3">
            <CardTitle className="text-xl md:text-2xl">{bike.name}</CardTitle>
            {bike.is_primary && (
              <Badge className="bg-primary-strava hover:bg-primary-strava text-white">
                Primary
              </Badge>
            )}
          </div>
          {(bike.brand_name || bike.model_name) && (
            <span className="text-muted-foreground text-sm md:text-base">
              {bike.brand_name} {bike.model_name}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Bike stats bar */}
        <div className="flex flex-wrap gap-6 py-3 px-4 bg-dark-grey-3 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Distance</span>
            <span className="font-medium">{formatDistance(bike.total_distance)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Type</span>
            <span className="font-medium">{bikeType}</span>
          </div>
          {bike.description && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">Description</span>
              <span className="font-medium">{bike.description}</span>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex flex-col lg:flex-row w-full gap-8">
          {/* Bike SVG */}
          <div className="flex-shrink-0 rounded-xl bg-dark-grey-5 p-4 flex items-center justify-center">
            <RoadBikeSvg width={400} height={200} />
          </div>

          {/* Components grid */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            {bike.components.length > 0 ? (
              bike.components.map((component) => (
                <ComponentCard key={component.id} component={component} />
              ))
            ) : (
              <div className="col-span-2 flex items-center justify-center text-center text-muted-foreground py-12 bg-dark-grey-3 rounded-xl">
                <p>No components tracked yet. Sync with Strava to add default components.</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ComponentCardProps {
  component: Component;
}

function ComponentCard({ component }: ComponentCardProps) {
  const wear = calculateComponentWear(component);
  const percentage = Math.min(
    (component.current_distance / component.recommended_distance) * 100,
    100
  );

  return (
    <Card className="border-0 bg-dark-grey-3 text-white">
      <CardContent className="p-4 flex flex-col justify-between gap-2">
        <dl className="flex flex-row justify-between">
          <dt className="flex items-center gap-2">
            {component.name}
            {wear.status !== "healthy" && (
              <StatusBadge status={wear.status} />
            )}
          </dt>
          <dd className="text-secondary-strava">
            <span>{formatDistance(component.current_distance)}</span>
            <span className="font-bold text-light-grey-1"> / </span>
            <span className="text-light-grey-1">
              {formatDistance(component.recommended_distance)}
            </span>
          </dd>
        </dl>
        <Progress
          value={percentage}
          className="h-2 bg-dark-grey-5"
          indicatorClassName={wearIndicatorColor(wear.status)}
        />
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: WearStatus }) {
  const variants: Record<WearStatus, { className: string; label: string }> = {
    warning: {
      className: "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border-0",
      label: "Due soon",
    },
    critical: {
      className: "bg-red-500/20 text-red-400 hover:bg-red-500/30 border-0",
      label: "Overdue",
    },
    healthy: { className: "", label: "" },
  };

  const { className, label } = variants[status];
  return <Badge className={className}>{label}</Badge>;
}

function wearIndicatorColor(status: WearStatus): string {
  switch (status) {
    case "healthy":
      return "bg-green-400";
    case "warning":
      return "bg-yellow-400";
    case "critical":
      return "bg-red-400";
  }
}

// Road bike SVG component
interface RoadBikeProps {
  width: number;
  height: number;
}

function RoadBikeSvg({ width = 200, height = 100 }: RoadBikeProps) {
  const cx2 = 150;
  const cy2 = 75;
  const lineLength = 50;
  const angle = 30 * (Math.PI / 180);
  const x2 = cx2 - lineLength * Math.sin(angle);
  const y2 = cy2 - lineLength * Math.cos(angle);

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Wheels */}
      <circle
        cx="50"
        cy="75"
        r="20"
        stroke="white"
        strokeWidth="2"
        fill="none"
      />
      <circle
        cx="150"
        cy="75"
        r="20"
        stroke="white"
        strokeWidth="2"
        fill="none"
      />
      {/* Rear frame */}
      <polygon
        points="50,75 90,75 75,45"
        stroke="white"
        strokeWidth="2"
        fill="none"
      />
      {/* Fork */}
      <line x1={cx2} y1={cy2} x2={x2} y2={y2} stroke="white" strokeWidth="2" />
    </svg>
  );
}
