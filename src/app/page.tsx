import { Dashboard } from "@/components/dashboard/dashboard";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { LoginPage } from "@/components/shared/login-page";
import { auth } from "@/lib/auth/config";
import {
  getBikesWithComponents,
  getSyncStatus,
  getTypesWithHistoryForBikes,
  getUserEmail,
  getVirtualKmForBikes,
} from "@/lib/db/queries";
import { canUseEmailNotifications } from "@/lib/notifications/access";

// Allow up to 60 s for server actions (sync) on this route — takes effect on Pro.
// On Hobby the hard cap is 10 s; sync is designed to fit within that limit.
export const maxDuration = 60;

export default async function Home() {
  const session = await auth();

  if (!session?.userId) {
    return <LoginPage />;
  }

  const [bikes, retiredBikes, syncStatus, userEmail] = await Promise.all([
    getBikesWithComponents(session.userId),
    getBikesWithComponents(session.userId, { retired: true }),
    getSyncStatus(session.userId),
    getUserEmail(session.userId),
  ]);

  const lastSync = syncStatus?.last_bike_sync || syncStatus?.last_activity_sync || null;
  const notificationsEnabled = canUseEmailNotifications(session.userId);

  if (bikes.length === 0 && retiredBikes.length === 0) {
    return (
      <AppShell bikes={[]} userEmail={userEmail} notificationsEnabled={notificationsEnabled}>
        <EmptyState />
      </AppShell>
    );
  }

  const bikeIds = [...bikes, ...retiredBikes].map((b) => b.id);
  const [historyByBike, virtualKmByBike] = await Promise.all([
    getTypesWithHistoryForBikes(bikeIds),
    getVirtualKmForBikes(bikeIds),
  ]);

  return (
    <AppShell
      bikes={bikes}
      retiredBikes={retiredBikes}
      userEmail={userEmail}
      notificationsEnabled={notificationsEnabled}
    >
      <Dashboard
        bikes={bikes}
        retiredBikes={retiredBikes}
        lastSync={lastSync}
        historyByBike={historyByBike}
        virtualKmByBike={virtualKmByBike}
      />
    </AppShell>
  );
}
