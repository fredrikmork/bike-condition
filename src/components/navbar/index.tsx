import { StravaLoginButton } from "../StravaLoginButton";

export function Navbar() {
  return (
    <nav className="text-white rounded-md m-2 flex md:flex-row justify-between items-center h-32 container flex-col">
      <h1 className="mt-6 md:mt-0">Strava Bike Dashboard</h1>
      <StravaLoginButton />
    </nav>
  );
}
