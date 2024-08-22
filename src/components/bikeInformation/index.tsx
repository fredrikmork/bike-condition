import getStravaType from "@/app/getActivites";

export function BikeInformation() {
  const profile = getStravaType("https://www.strava.com/api/v3/athlete");
  console.log("Profile: ", profile);

  return (
    <section className="p-5 flex flex-col gap-2">
      <h2 className="flex justify-center">Bike Information</h2>
      <p>Her vil du finne informasjon om sykkeldelene dine.</p>
      <dl className="--secondary-color">
        <dt>Primary bike</dt>
        <dl>{`Nickname: `}</dl>
      </dl>
    </section>
  );
}
