import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type { BikeWithComponents } from "@/lib/supabase/types";
import { AppSidebar } from "./app-sidebar";
import { DashboardHeader } from "./dashboard-header";

interface AppShellProps {
  bikes: BikeWithComponents[];
  retiredBikes?: BikeWithComponents[];
  userEmail?: string | null;
  notificationsEnabled?: boolean;
  children: React.ReactNode;
}

export function AppShell({
  bikes,
  retiredBikes = [],
  userEmail,
  notificationsEnabled,
  children,
}: AppShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar bikes={bikes} retiredBikes={retiredBikes} />
      <SidebarInset>
        <DashboardHeader
          userEmail={userEmail ?? null}
          notificationsEnabled={notificationsEnabled ?? false}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
