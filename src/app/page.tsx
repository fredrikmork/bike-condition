import { Navbar } from "@/components/navbar";
import getStravaType, { GEAR_ENDPOINT } from "./getActivites";
import { Footer } from "@/components/footer";
import { BikeInformation } from "@/components/bikeInformation";

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

  return (
    <div className="font-poppins min-h-screen">
      <Navbar />
      <main className="flex flex-row gap-2 m-2 min-h-screen pt-2">
        {/* <section className="bg-dark-grey-1 rounded-md">
          <menu className="p-4">
            <li className="p-4">Primary</li>
            <li className="p-4">Bikes</li>
            <li className="p-4 border-slate-100">User</li>
          </menu>
        </section> */}

        <section className="bg-dark-grey-2 p-4 rounded-md w-screen">
          <BikeInformation />
          {/* <section className="bg-red-300">
            <h3>Components</h3>
            <ul>
              <li>Wheels</li>
              <li>Drive train</li>
              <li>Brakes</li>
            </ul>
          </section> */}
          {/* <table className="table-auto bg-green-500">
            <thead>
              <tr>
                <th>Brand</th>
                <th>Mode</th>
                <th>Distance</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{brand_name}</td>
                <td>{model_name}</td>
                <td>{distance / 1000} km</td>
              </tr>
            </tbody>
          </table> */}
        </section>
      </main>
      {/* <Footer /> */}
    </div>
  );
}
