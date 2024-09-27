import getStravaType from "@/app/getActivites";
import { DetailedGear } from "@/types/detailedGear";

interface Props {
  selectedBike: DetailedGear;
}

export function SelectedBike({ selectedBike }: Props) {
  const profile = getStravaType("https://www.strava.com/api/v3/athlete");
  console.log("Profile: ", profile);

  return (
    <section className="p-5 flex flex-col gap-2 bg-dark-grey-4 rounded-xl">
      <h2 className="">{selectedBike.name}</h2>
      <div className="flex justify-center">
        <RoadBikeSvg width={800} height={400} />
      </div>
      <dl>
        <dt>Primary bike</dt>
        <dl>{`Nickname: `}</dl>
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
