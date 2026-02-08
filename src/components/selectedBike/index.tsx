import type { BikeWithComponents, Component } from "@/lib/supabase/types";
import {
  calculateComponentWear,
  getWearColor,
  formatDistance,
  type WearStatus,
} from "@/lib/wear/calculator";

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
    <section className="p-6 md:p-8 flex flex-col gap-6 bg-dark-grey-4 rounded-xl text-white">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl md:text-2xl font-semibold">{bike.name}</h2>
          {bike.is_primary && (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-primary-strava">
              Primary
            </span>
          )}
        </div>
        {(bike.brand_name || bike.model_name) && (
          <span className="text-gray-400 text-sm md:text-base">
            {bike.brand_name} {bike.model_name}
          </span>
        )}
      </header>

      {/* Bike stats bar */}
      <div className="flex flex-wrap gap-6 py-3 px-4 bg-dark-grey-3 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Distance</span>
          <span className="font-medium">{formatDistance(bike.total_distance)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Type</span>
          <span className="font-medium">{bikeType}</span>
        </div>
        {bike.description && (
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Description</span>
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
            <div className="col-span-2 flex items-center justify-center text-center text-gray-400 py-12 bg-dark-grey-3 rounded-xl">
              <p>No components tracked yet. Sync with Strava to add default components.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

interface ComponentCardProps {
  component: Component;
}

function ComponentCard({ component }: ComponentCardProps) {
  const wear = calculateComponentWear(component);

  return (
    <div className="bg-dark-grey-3 p-4 rounded-xl flex flex-col justify-between">
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
      <ProgressBar
        value={component.current_distance}
        max={component.recommended_distance}
        status={wear.status}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: WearStatus }) {
  const colors = {
    warning: "bg-yellow-500/20 text-yellow-400",
    critical: "bg-red-500/20 text-red-400",
    healthy: "",
  };

  const labels = {
    warning: "Due soon",
    critical: "Overdue",
    healthy: "",
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded ${colors[status]}`}>
      {labels[status]}
    </span>
  );
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

interface ProgressBarProps {
  value: number;
  max?: number;
  height?: number;
  status?: WearStatus;
}

function ProgressBar({
  value,
  max = 100,
  height = 8,
  status = "healthy",
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const fillColor = getWearColor(status);
  const backgroundColor = "#4a4a4a";

  return (
    <div
      style={{
        height: `${height}px`,
        width: "100%",
        backgroundColor: backgroundColor,
        borderRadius: `${height / 2}px`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${percentage}%`,
          height: "100%",
          backgroundColor: fillColor,
          transition: "width 0.5s ease-in-out",
        }}
      />
    </div>
  );
}
