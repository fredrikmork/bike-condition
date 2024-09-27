import getStravaType, { GEAR_ENDPOINT } from "./getActivites";
import { Footer } from "@/components/footer";
import { SelectedBike } from "@/components/selectedBike";
import detailedGear from "../json/detailedGear.json";
import { StravaLoginButton } from "@/components/StravaLoginButton";

// const getStaticProps = async () => {
//   const gear = await getStravaType(GEAR_ENDPOINT);
//   return {
//     props: {
//       gear,
//     },
//     revalidate: 3600,
//   };
// };

export default async function Home() {
  // const props = await getStaticProps();
  // const { brand_name, model_name, weight, distance, primary } =
  //   props.props.gear;
  // console.log("Props: ", brand_name, model_name, weight, distance, primary);
  const primaryBike = detailedGear.find(({ primary }) => Boolean(primary));
  const otherBikes = detailedGear.filter(({ primary }) => !Boolean(primary));
  return (
    <div className="bg-dark-grey-3 font-poppins min-h-screen -mt-2 px-4">
      <header className="text-white rounded-md m-2 flex md:flex-row justify-between items-center h-32 container flex-col w-full">
        <h1 className="mt-6 md:mt-0">Strava Bike Dashboard</h1>
        <StravaLoginButton />
      </header>

      <main className="flex flex-row gap-2 m-2 min-h-screen pt-2">
        <section className="w-screen">
          {primaryBike && <SelectedBike selectedBike={primaryBike} />}
          {otherBikes.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 pt-10">
              {otherBikes.map((bike) => (
                <div className="rounded-md bg-dark-grey-4 p-6" key={bike.id}>
                  <div className="flex flex-col md:flex-row justify-between items-center pb-2">
                    <h2>{bike.name}</h2>
                    <p className="text-gray-300">
                      {bike.brand_name} {bike.model_name}
                    </p>
                  </div>

                  <dl className="flex flex-col gap-1">
                    <div className="flex flex-col md:flex-row gap-1">
                      <dt>Total distance</dt>
                      <dd className="text-gray-300">
                        {(bike.distance / 1000).toFixed(1)} km
                      </dd>
                    </div>
                    <div className="flex flex-col md:flex-row gap-1">
                      <dt>Description</dt>
                      <dd className="text-gray-300">{bike.description}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      {/* <Footer /> */}
    </div>
  );
}
