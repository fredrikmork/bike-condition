"use client";

import Image from "next/image";
import { signOut, signIn, useSession } from "next-auth/react";
import { FaRegUser } from "react-icons/fa6";

export function StravaLoginButton() {
  const { data: session } = useSession();

  const onClick = session ? signOut : () => signIn("strava");

  const logInButtonText = session ? session.user?.name : "Log in";

  return (
    <button
      onClick={() => onClick()}
      className="text-sm md:text-base flex items-center flex-row gap-2 border-2 border-transparent hover:border-2 hover:border-current p-2 rounded-md mr-4"
    >
      {session?.user?.image ? (
        <Image
          src={session.user.image}
          alt="strava"
          width={24}
          height={24}
          sizes="24px"
          className="mx-2 rounded-full  md:w-6 md:h-6 w-4 h-4"
        />
      ) : (
        <FaRegUser color="white" size="24px" className="text-xl md:text-2xl" />
      )}
      <span className="hidden md:block">{logInButtonText}</span>
    </button>
  );
}
