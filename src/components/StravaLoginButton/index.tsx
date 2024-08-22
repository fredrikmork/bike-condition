"use client";

import Image from "next/image";
import { signOut, signIn, useSession } from "next-auth/react";

export function StravaLoginButton() {
  const { data: session } = useSession();

  const onClick = session ? signOut : () => signIn("strava");

  const text = session ? "Disconnect from Strava" : "Connect to Strava";
  return (
    <button
      onClick={() => onClick()}
      className="flex h-12 items-center justify-center rounded border border-orange-600 bg-black p-4"
    >
      {session?.user?.image && (
        <Image
          src={session.user.image}
          alt="strava"
          width={24}
          height={24}
          className="mx-2"
        />
      )}
      <span>{text}</span>
    </button>
  );
}
