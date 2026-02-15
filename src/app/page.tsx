import { auth } from "@/lib/auth/config";
import { getBikesWithComponents, getDashboardStats } from "@/lib/db/queries";
import { LoginPage } from "@/components/shared/login-page";
import { AppShell } from "@/components/layout/app-shell";
import { Dashboard } from "@/components/dashboard/dashboard";
import { EmptyState } from "@/components/shared/empty-state";

export default async function Home() {
  const session = await auth();

  if (!session?.userId) {
    return <LoginPage />;
  }

  const [bikes, stats] = await Promise.all([
    getBikesWithComponents(session.userId),
    getDashboardStats(session.userId),
  ]);

  if (bikes.length === 0) {
    return (
      <AppShell bikes={[]}>
        <EmptyState />
      </AppShell>
    );
  }

  return (
    <AppShell bikes={bikes}>
      <Dashboard bikes={bikes} stats={stats} />
    </AppShell>
  );
}
