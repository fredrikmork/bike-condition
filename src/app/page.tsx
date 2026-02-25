import { auth } from "@/lib/auth/config";
import { getBikesWithComponents, getSyncStatus, getTypesWithHistoryForBikes } from "@/lib/db/queries";
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

  const [bikes, syncStatus] = await Promise.all([
    getBikesWithComponents(session.userId),
    getSyncStatus(session.userId),
  ]);

  const lastSync = syncStatus?.last_bike_sync || syncStatus?.last_activity_sync || null;

  if (bikes.length === 0) {
    return (
      <AppShell bikes={[]} lastSynced={lastSync}>
        <EmptyState />
      </AppShell>
    );
  }

  const historyByBike = await getTypesWithHistoryForBikes(bikes.map((b) => b.id));

  return (
    <AppShell bikes={bikes} lastSynced={lastSync}>
      <Dashboard bikes={bikes} lastSync={lastSync} historyByBike={historyByBike} />
    </AppShell>
  );
}
