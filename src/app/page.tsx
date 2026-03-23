import { auth } from "@/lib/auth/config";
import { getBikesWithComponents, getSyncStatus, getTypesWithHistoryForBikes, getVirtualKmForBikes, getUserEmail } from "@/lib/db/queries";
import { LoginPage } from "@/components/shared/login-page";
import { AppShell } from "@/components/layout/app-shell";
import { Dashboard } from "@/components/dashboard/dashboard";
import { EmptyState } from "@/components/shared/empty-state";

// Allow up to 60 s for server actions (sync) on this route — takes effect on Pro.
// On Hobby the hard cap is 10 s; sync is designed to fit within that limit.
export const maxDuration = 60;

export default async function Home() {
  const session = await auth();

  if (!session?.userId) {
    return <LoginPage />;
  }

  const [bikes, syncStatus, userEmail] = await Promise.all([
    getBikesWithComponents(session.userId),
    getSyncStatus(session.userId),
    getUserEmail(session.userId),
  ]);

  const lastSync = syncStatus?.last_bike_sync || syncStatus?.last_activity_sync || null;

  if (bikes.length === 0) {
    return (
      <AppShell bikes={[]} lastSynced={lastSync} userEmail={userEmail}>
        <EmptyState />
      </AppShell>
    );
  }

  const bikeIds = bikes.map((b) => b.id);
  const [historyByBike, virtualKmByBike] = await Promise.all([
    getTypesWithHistoryForBikes(bikeIds),
    getVirtualKmForBikes(bikeIds),
  ]);

  return (
    <AppShell bikes={bikes} lastSynced={lastSync} userEmail={userEmail}>
      <Dashboard bikes={bikes} lastSync={lastSync} historyByBike={historyByBike} virtualKmByBike={virtualKmByBike} />
    </AppShell>
  );
}
