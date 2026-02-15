import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { DashboardHeader } from "./dashboard-header";
import type { BikeWithComponents } from "@/lib/supabase/types";

interface AppShellProps {
  bikes: BikeWithComponents[];
  children: React.ReactNode;
}

export function AppShell({ bikes, children }: AppShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar bikes={bikes} />
      <SidebarInset>
        <DashboardHeader />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
