"use client";

import { useState, useEffect } from "react";
import { LogOut, Mail, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useMounted } from "@/hooks/use-mounted";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmailSettingsDialog } from "./email-settings-dialog";
import { getUserEmail } from "@/app/actions/user";

export function SidebarUserMenu() {
  const { data: session } = useSession();
  const mounted = useMounted();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);

  useEffect(() => {
    if (mounted && session?.userId) {
      getUserEmail().then(setCurrentEmail);
    }
  }, [mounted, session?.userId]);

  // Render a placeholder during SSR to avoid Radix useId hydration mismatch
  if (!mounted) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="grid flex-1 gap-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-2 w-14" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={session?.user?.image ?? undefined}
                  alt={session?.user?.name ?? "User"}
                />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {session?.user?.name ?? "Athlete"}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {session?.user?.email ?? "Strava"}
                </span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
            side="top"
            align="start"
            sideOffset={4}
          >
            <DropdownMenuItem onClick={() => setEmailDialogOpen(true)}>
              <Mail className="mr-2 h-4 w-4" />
              E-postvarsler
              {currentEmail && (
                <span className="ml-auto text-xs text-muted-foreground truncate max-w-28">
                  {currentEmail}
                </span>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      <EmailSettingsDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        currentEmail={currentEmail}
      />
    </SidebarMenu>
  );
}
