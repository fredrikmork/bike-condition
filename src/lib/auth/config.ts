import NextAuth from "next-auth";
import Strava from "next-auth/providers/strava";
import { supabaseAdmin } from "@/lib/supabase/server";
import { storeTokens, refreshStravaToken } from "@/lib/strava/tokens";

import type { NextAuthConfig } from "next-auth";

declare module "next-auth" {
  interface Session {
    userId?: string;
    stravaId?: number;
    accessToken?: string;
  }
}

interface AppJWT {
  userId?: string;
  stravaId?: number;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

async function createOrUpdateUser(
  stravaId: number,
  name: string | null | undefined,
  email: string | null | undefined,
  image: string | null | undefined
): Promise<string> {
  // Check if user exists
  const { data: existingUser } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("strava_id", stravaId)
    .single();

  if (existingUser) {
    // Update existing user
    await supabaseAdmin
      .from("users")
      .update({
        name: name ?? null,
        email: email ?? null,
        profile_image: image ?? null,
      })
      .eq("id", existingUser.id);

    return existingUser.id;
  }

  // Create new user
  const { data: newUser, error } = await supabaseAdmin
    .from("users")
    .insert({
      strava_id: stravaId,
      name: name ?? null,
      email: email ?? null,
      profile_image: image ?? null,
    })
    .select("id")
    .single();

  if (error || !newUser) {
    throw new Error(`Failed to create user: ${error?.message}`);
  }

  // Create sync status entry for new user
  await supabaseAdmin.from("sync_status").insert({
    user_id: newUser.id,
  });

  return newUser.id;
}

const config: NextAuthConfig = {
  providers: [
    Strava({
      clientId: process.env.STRAVA_CLIENT_ID ?? "",
      clientSecret: process.env.STRAVA_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          scope: "read,activity:read_all,profile:read_all",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!account || account.provider !== "strava") {
        return true;
      }

      try {
        const stravaId = parseInt(account.providerAccountId, 10);

        // Create or update user in Supabase
        const userId = await createOrUpdateUser(
          stravaId,
          user.name,
          user.email,
          user.image
        );

        // Store tokens in Supabase
        if (account.access_token && account.refresh_token && account.expires_at) {
          await storeTokens(
            userId,
            account.access_token,
            account.refresh_token,
            account.expires_at
          );
        }

        return true;
      } catch (error) {
        console.error("Sign-in failed:", error instanceof Error ? error.message : "Unknown error");
        return false;
      }
    },

    async jwt({ token, account }) {
      const t = token as typeof token & AppJWT;

      // Initial sign in
      if (account) {
        const stravaId = parseInt(account.providerAccountId, 10);

        // Get user ID from database
        const { data: user } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("strava_id", stravaId)
          .single();

        t.userId = user?.id;
        t.stravaId = stravaId;
        t.accessToken = account.access_token as string | undefined;
        t.refreshToken = account.refresh_token as string | undefined;
        t.expiresAt = account.expires_at;

        return t;
      }

      // Check if token needs refresh
      if (t.expiresAt && t.refreshToken) {
        const now = Math.floor(Date.now() / 1000);
        const bufferSeconds = 5 * 60; // 5 minute buffer

        if (t.expiresAt - now < bufferSeconds) {
          try {
            const newTokens = await refreshStravaToken(t.refreshToken);

            t.accessToken = newTokens.accessToken;
            t.refreshToken = newTokens.refreshToken;
            t.expiresAt = Math.floor(newTokens.expiresAt.getTime() / 1000);

            // Update tokens in database
            if (t.userId) {
              await storeTokens(
                t.userId,
                newTokens.accessToken,
                newTokens.refreshToken,
                t.expiresAt
              );
            }
          } catch (error) {
            console.error("Token refresh failed:", error instanceof Error ? error.message : "Unknown error");
            // Return token as-is, client will need to re-authenticate
          }
        }
      }

      return t;
    },

    async session({ session, token }) {
      const t = token as typeof token & AppJWT;
      return {
        ...session,
        userId: t.userId,
        stravaId: t.stravaId,
        accessToken: t.accessToken,
      };
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
