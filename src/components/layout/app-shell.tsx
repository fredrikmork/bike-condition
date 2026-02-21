import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { DashboardHeader } from "./dashboard-header";
import type { BikeWithComponents } from "@/lib/supabase/types";

interface AppShellProps {
  bikes: BikeWithComponents[];
  lastSynced?: string | null;
  children: React.ReactNode;
}

export function AppShell({ bikes, lastSynced, children }: AppShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar bikes={bikes} lastSynced={lastSynced} />
      <SidebarInset>
        <DashboardHeader />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
