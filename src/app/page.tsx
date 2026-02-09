import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { Plus } from "lucide-react";
import { Footer } from "@/components/footer";
import { SelectedBike } from "@/components/selectedBike";
import { StravaLoginButton } from "@/components/StravaLoginButton";
import { SyncButton } from "@/components/SyncButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
            <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
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

  // Show primary bike, or fall back to the most ridden bike
  const primaryBike =
    bikes.find((bike) => bike.is_primary) ??
    bikes.toSorted((a, b) => b.total_distance - a.total_distance)[0] ??
    null;
  const otherBikes = bikes.filter((bike) => bike !== primaryBike);
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
                <Plus className="w-20 h-20 mx-auto text-muted-foreground" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-bold mb-4 text-white">No bikes yet</h2>
              <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
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
                    <Card
                      className="border-0 bg-dark-grey-4 hover:bg-dark-grey-3 transition-colors text-white"
                      key={bike.id}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg">{bike.name}</CardTitle>
                        {(bike.brand_name || bike.model_name) && (
                          <p className="text-muted-foreground text-sm">
                            {bike.brand_name} {bike.model_name}
                          </p>
                        )}
                      </CardHeader>

                      <CardContent>
                        <dl className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Total distance</dt>
                            <dd className="text-white font-medium">
                              {(bike.total_distance / 1000).toFixed(1)} km
                            </dd>
                          </div>
                          {bike.description && (
                            <div className="flex justify-between">
                              <dt className="text-muted-foreground">Description</dt>
                              <dd className="text-gray-300">{bike.description}</dd>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Components</dt>
                            <dd className="text-white">{bike.components.length} tracked</dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
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
