import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { Footer } from "@/components/footer";
import { SelectedBike } from "@/components/selectedBike";
import { StravaLoginButton } from "@/components/StravaLoginButton";
import { SyncButton } from "@/components/SyncButton";
import { getBikesWithComponents } from "@/lib/db/queries";
import type { BikeWithComponents } from "@/lib/supabase/types";

export default async function Home() {
  const session = await getServerSession(authOptions);

  // If not authenticated, show login prompt
  if (!session?.userId) {
    return (
      <div className="font-poppins min-h-screen px-4 md:px-8">
        <header className="text-white flex justify-center items-center py-8">
          <h1 className="text-2xl md:text-3xl font-semibold">Bike Condition</h1>
        </header>

        <main className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
          <div className="text-center max-w-lg px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              Welcome to Bike Condition
            </h2>
            <p className="text-gray-400 mb-8 text-lg leading-relaxed">
              Track your bike component wear and know when it&apos;s time for maintenance.
              Connect your Strava account to get started.
            </p>
            <StravaLoginButton />
          </div>
        </main>
      </div>
    );
  }

  // Fetch bikes from database
  let bikes: BikeWithComponents[] = [];
  try {
    bikes = await getBikesWithComponents(session.userId);
  } catch (error) {
    console.error("Failed to fetch bikes:", error);
  }

  const primaryBike = bikes.find((bike) => bike.is_primary);
  const otherBikes = bikes.filter((bike) => !bike.is_primary);
  const hasBikes = bikes.length > 0;

  return (
    <div className="font-poppins min-h-screen px-4 md:px-8">
      {/* Header */}
      <header className="text-white flex flex-col md:flex-row justify-between items-center py-6 gap-4 border-b border-dark-grey-3 mb-6">
        <h1 className="text-xl md:text-2xl font-semibold">Bike Condition</h1>
        <div className="flex items-center gap-4">
          {hasBikes && <SyncButton />}
          <StravaLoginButton />
        </div>
      </header>

      {/* Main content */}
      <main className="pb-12">
        {!hasBikes ? (
          /* No bikes - show centered sync prompt */
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
            <div className="text-center max-w-md px-4">
              <div className="mb-6">
                <svg
                  className="w-20 h-20 mx-auto text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-4 text-white">No bikes yet</h2>
              <p className="text-gray-400 mb-8 text-lg leading-relaxed">
                Sync with Strava to import your bikes and start tracking component wear.
              </p>
              <SyncButton />
            </div>
          </div>
        ) : (
          /* Has bikes - show bike list */
          <div className="space-y-8">
            {primaryBike && <SelectedBike bike={primaryBike} />}

            {otherBikes.length > 0 && (
              <div>
                <h2 className="text-lg font-medium text-gray-300 mb-4">Other bikes</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {otherBikes.map((bike) => (
                    <div
                      className="rounded-xl bg-dark-grey-4 p-6 hover:bg-dark-grey-3 transition-colors"
                      key={bike.id}
                    >
                      <div className="flex flex-col gap-2 mb-4">
                        <h3 className="text-lg font-medium text-white">{bike.name}</h3>
                        {(bike.brand_name || bike.model_name) && (
                          <p className="text-gray-400 text-sm">
                            {bike.brand_name} {bike.model_name}
                          </p>
                        )}
                      </div>

                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-gray-400">Total distance</dt>
                          <dd className="text-white font-medium">
                            {(bike.total_distance / 1000).toFixed(1)} km
                          </dd>
                        </div>
                        {bike.description && (
                          <div className="flex justify-between">
                            <dt className="text-gray-400">Description</dt>
                            <dd className="text-gray-300">{bike.description}</dd>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <dt className="text-gray-400">Components</dt>
                          <dd className="text-white">{bike.components.length} tracked</dd>
                        </div>
                      </dl>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
