import { StravaLoginButton } from "../StravaLoginButton";

export function Navbar() {
  return (
    <nav className="text-white rounded-md m-2 flex flex-row justify-between items-center  h-32 ">
      {/*bg-gradient-linear*/}
      <StravaLoginButton />
      <h1>Bike condition</h1>
    </nav>
  );
}
