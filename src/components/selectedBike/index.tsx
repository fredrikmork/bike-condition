import getStravaType from "@/app/getActivites";
import { DetailedGear } from "@/types/detailedGear";

interface Props {
  selectedBike: DetailedGear;
}

export function SelectedBike({ selectedBike }: Props) {
  const profile = getStravaType("https://www.strava.com/api/v3/athlete");
  console.log("Profile: ", profile);

  const bikeParts = [
    { name: "Tires", id: "tires", distance: 3000, recommended: 5000 },
    { name: "Wheels", id: "wheels", distance: 19124, recommended: 20000 },
    { name: "Chain", id: "chain", distance: 2200, recommended: 2000 },
    { name: "Cassette", id: "cassette", distance: 1500, recommended: 6000 },
    { name: "Frame", id: "frame", distance: 10000, recommended: 50000 },
    { name: "Seatpost", id: "seatpost", distance: 8000, recommended: 30000 },
    { name: "Aerobar", id: "aerobar", distance: 6000, recommended: 25000 },
  ];

  return (
    <section className="p-5 flex flex-col gap-2 bg-dark-grey-4 rounded-xl text-white">
      <header className="flex-row flex gap-4">
        <h2 className="">{selectedBike.name}</h2>
        {selectedBike.primary && (
          <div className="px-3 rounded-3xl bg-primary-strava flex items-center">
            Primary
          </div>
        )}
      </header>
      <div className="flex flex-row w-full gap-10">
        <div className="rounded-lg bg-dark-grey-5">
          <RoadBikeSvg width={800} height={400} />
        </div>
        <div className="md:grid flex md:grid-cols-2 md:grid-rows-4 flex-col gap-6 w-1/2">
          {bikeParts.map((part) => (
            <div
              key={part.id}
              className="bg-dark-grey-3 p-4 rounded-xl flex flex-col justify-between"
            >
              <dl className="flex flex-row justify-between">
                <dt>{part.name}</dt>
                <dd className="text-secondary-strava">
                  <span>{part.distance}</span>
                  <span className="font-bold text-light-grey-1"> / </span>
                  <span className="text-light-grey-1 ">{part.recommended}</span>
                  <span> km</span>
                </dd>
              </dl>
              <ProgressBar value={part.distance} max={part.recommended} />
            </div>
          ))}
        </div>
      </div>
      <dl className="flex flex-row gap-4 py-3">
        <div>
          <dt>Total distance</dt>
          <dd className="text-gray-300">{selectedBike.distance / 1000} km</dd>
        </div>
        <div>
          <dt>Description</dt>
          <dd className="text-gray-300">{selectedBike.description}</dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd className="text-gray-300">
            {selectedBike.frame_type === 3 ? "Road bike" : "Mountain bike"}
          </dd>
        </div>
      </dl>
    </section>
  );
}

// I want a svg of a road bike
interface RoadBikeProps {
  width: number;
  height: number;
}

function RoadBikeSvg({ width = 200, height = 100 }: RoadBikeProps) {
  // Center of the second wheel
  const cx2 = 150;
  const cy2 = 75;

  // Length of the line
  const lineLength = 50;

  // Calculate the endpoint of the line using 30 degrees from vertical
  const angle = 30 * (Math.PI / 180); // Convert degrees to radians
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
// I want a svg of a mountain bike
// I want a svg of a gravel bike
// I want a svg of a commuter bike

interface ProgressBarProps {
  value: number;
  max?: number;
  height?: number;
  backgroundColor?: string;
  fillColor?: string;
}

function ProgressBar({
  value,
  max = 100,
  height = 8,
  backgroundColor = "#4a4a4a",
  fillColor = "#81C784",
}: ProgressBarProps) {
  const percentage = (value / max) * 100;

  const warningYellow = "#FFEE58";
  const warningRed = "#FF7f50";

  const currentFillColor =
    percentage >= 100
      ? warningRed
      : percentage >= 80
      ? warningYellow
      : fillColor;
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
          backgroundColor: currentFillColor,
          transition: "width 0.5s ease-in-out",
        }}
      />
    </div>
  );
}
