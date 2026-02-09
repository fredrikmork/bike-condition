"use client";

import Image from "next/image";
import { signOut, signIn, useSession } from "next-auth/react";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function StravaLoginButton() {
  const { data: session, status } = useSession();

  const handleClick = () => {
    if (session) {
      signOut();
    } else {
      signIn("strava");
    }
  };

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <Button variant="ghost" disabled className="gap-2">
        <User className="h-5 w-5" />
        <Skeleton className="h-4 w-16" />
      </Button>
    );
  }

  // Logged out state - show prominent login button
  if (!session) {
    return (
      <Button
        onClick={handleClick}
        className="gap-3 bg-primary-strava hover:bg-orange-600 text-white shadow-lg hover:shadow-xl"
        size="lg"
      >
        <StravaIcon />
        <span>Connect with Strava</span>
      </Button>
    );
  }

  // Logged in state - show user profile
  return (
    <Button
      onClick={handleClick}
      variant="ghost"
      className="gap-2 text-white hover:bg-accent"
    >
      {session.user?.image ? (
        <Image
          src={session.user.image}
          alt="Profile"
          width={28}
          height={28}
          sizes="28px"
          className="rounded-full"
        />
      ) : (
        <User className="h-5 w-5" />
      )}
      <span className="hidden md:block text-sm">{session.user?.name}</span>
    </Button>
  );
}

function StravaIcon() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066l-2.084 4.116z" />
      <path d="M7.778 13.828h3.193l4.416-8.828H12.19l-2.1 4.2-2.1-4.2H4.793l4.985 8.828z" opacity="0.6" />
    </svg>
  );
}
