"use client";

import Image from "next/image";
import { signOut, signIn, useSession } from "next-auth/react";
import { FaRegUser } from "react-icons/fa6";

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
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 rounded-lg opacity-50 bg-dark-grey-3"
      >
        <FaRegUser color="white" size="20px" />
        <span className="text-sm text-gray-400">Loading...</span>
      </button>
    );
  }

  // Logged out state - show prominent login button
  if (!session) {
    return (
      <button
        onClick={handleClick}
        className="flex items-center gap-3 px-6 py-3 rounded-lg font-medium
          bg-primary-strava hover:bg-orange-600 text-white
          transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        <StravaIcon />
        <span>Connect with Strava</span>
      </button>
    );
  }

  // Logged in state - show user profile
  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 px-3 py-2 rounded-lg
        bg-dark-grey-3 hover:bg-dark-grey-2 text-white
        transition-colors duration-200"
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
        <FaRegUser size="20px" />
      )}
      <span className="hidden md:block text-sm">{session.user?.name}</span>
    </button>
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
