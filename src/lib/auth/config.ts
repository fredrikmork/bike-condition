import { type NextAuthOptions, type Account, type User } from "next-auth";
import StravaProvider from "next-auth/providers/strava";
import { supabaseAdmin } from "@/lib/supabase/server";
import { storeTokens, refreshStravaToken } from "@/lib/strava/tokens";

declare module "next-auth" {
  interface Session {
    userId?: string;
    stravaId?: number;
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    stravaId?: number;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  }
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

export const authOptions: NextAuthOptions = {
  providers: [
    StravaProvider({
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
    async signIn({ user, account }: { user: User; account: Account | null }) {
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
      // Initial sign in
      if (account) {
        const stravaId = parseInt(account.providerAccountId, 10);

        // Get user ID from database
        const { data: user } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("strava_id", stravaId)
          .single();

        token.userId = user?.id;
        token.stravaId = stravaId;
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;

        return token;
      }

      // Check if token needs refresh
      if (token.expiresAt && token.refreshToken) {
        const now = Math.floor(Date.now() / 1000);
        const bufferSeconds = 5 * 60; // 5 minute buffer

        if (token.expiresAt - now < bufferSeconds) {
          try {
            const newTokens = await refreshStravaToken(token.refreshToken);

            token.accessToken = newTokens.accessToken;
            token.refreshToken = newTokens.refreshToken;
            token.expiresAt = Math.floor(newTokens.expiresAt.getTime() / 1000);

            // Update tokens in database
            if (token.userId) {
              await storeTokens(
                token.userId,
                newTokens.accessToken,
                newTokens.refreshToken,
                token.expiresAt
              );
            }
          } catch (error) {
            console.error("Token refresh failed:", error instanceof Error ? error.message : "Unknown error");
            // Return token as-is, client will need to re-authenticate
          }
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.userId = token.userId;
      session.stravaId = token.stravaId;
      session.accessToken = token.accessToken;

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
