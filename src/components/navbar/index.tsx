export function Navbar() {
  return (
    <nav className="text-white rounded-md m-2 flex flex-row justify-between items-center px-12 h-32 bg-gradient-linear">
      <div className="flex flex-row gap-10 text-xl">
        <ul className="hover:underline">Bikes</ul>
        <ul className="hover:underline">Active bike</ul>
        <ul className="hover:underline">User</ul>
      </div>
      <h1>Bike condition</h1>
    </nav>
  );
}
