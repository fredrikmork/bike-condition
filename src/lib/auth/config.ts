import NextAuth from "next-auth";
import Strava from "next-auth/providers/strava";
import { supabaseAdmin } from "@/lib/supabase/server";
import { storeTokens, refreshStravaToken } from "@/lib/strava/tokens";
import { StravaClient } from "@/lib/strava/client";

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
  // Upsert — one round-trip instead of SELECT + INSERT/UPDATE
  const { data: user, error } = await supabaseAdmin
    .from("users")
    .upsert(
      {
        strava_id: stravaId,
        name: name ?? null,
        email: email ?? null,
        profile_image: image ?? null,
      },
      { onConflict: "strava_id" }
    )
    .select("id")
    .single();

  if (error || !user) {
    throw new Error(`Failed to upsert user: ${error?.message}`);
  }

  // Ensure sync_status row exists (no-op for existing users)
  await supabaseAdmin
    .from("sync_status")
    .upsert({ user_id: user.id }, { onConflict: "user_id", ignoreDuplicates: true });

  return user.id;
}

const config: NextAuthConfig = {
  trustHost: true,
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

        // Fetch athlete profile from Strava to get the email address.
        // Auth.js Strava provider does not reliably return email, but
        // the /athlete endpoint includes it when profile:read_all is granted.
        let stravaEmail: string | null = user.email ?? null;
        if (!stravaEmail && account.access_token) {
          try {
            const athlete = await new StravaClient(account.access_token).getAthlete();
            stravaEmail = athlete.email ?? null;
          } catch {
            // Non-fatal — email stays null
          }
        }

        // Create or update user in Supabase
        const userId = await createOrUpdateUser(
          stravaId,
          user.name,
          stravaEmail,
          user.image
        );

        // Attach DB userId to the Auth.js user object so the jwt callback
        // can read it without a second database query.
        user.id = userId;

        // Store tokens in Supabase (parallel with sync_status already done inside createOrUpdateUser)
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

    async jwt({ token, user, account }) {
      const t = token as typeof token & AppJWT;

      // Initial sign in — user.id was set in signIn callback, no extra DB query needed
      if (account && user) {
        t.userId = user.id;
        t.stravaId = parseInt(account.providerAccountId, 10);
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
