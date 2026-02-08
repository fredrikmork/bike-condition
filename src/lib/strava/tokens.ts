import { supabaseAdmin } from "@/lib/supabase/server";
import { StravaTokenResponseSchema } from "./schemas";

const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";

interface TokenResult {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export async function refreshStravaToken(
  refreshToken: string
): Promise<TokenResult> {
  const response = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh Strava token: ${error}`);
  }

  const data = await response.json();
  const parsed = StravaTokenResponseSchema.parse(data);

  return {
    accessToken: parsed.access_token,
    refreshToken: parsed.refresh_token,
    expiresAt: new Date(parsed.expires_at * 1000),
  };
}

export async function getValidAccessToken(userId: string): Promise<string> {
  // Get current tokens from database
  const { data: tokenData, error } = await supabaseAdmin
    .from("user_tokens")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !tokenData) {
    throw new Error("No tokens found for user");
  }

  const expiresAt = new Date(tokenData.expires_at);
  const now = new Date();

  // Add 5 minute buffer before expiry
  const bufferMs = 5 * 60 * 1000;
  if (expiresAt.getTime() - now.getTime() > bufferMs) {
    // Token is still valid
    return tokenData.access_token;
  }

  // Token expired or about to expire, refresh it
  const newTokens = await refreshStravaToken(tokenData.refresh_token);

  // Update tokens in database
  const { error: updateError } = await supabaseAdmin
    .from("user_tokens")
    .update({
      access_token: newTokens.accessToken,
      refresh_token: newTokens.refreshToken,
      expires_at: newTokens.expiresAt.toISOString(),
    })
    .eq("user_id", userId);

  if (updateError) {
    throw new Error(`Failed to update tokens: ${updateError.message}`);
  }

  return newTokens.accessToken;
}

export async function storeTokens(
  userId: string,
  accessToken: string,
  refreshToken: string,
  expiresAt: number // Unix timestamp
): Promise<void> {
  const { error } = await supabaseAdmin.from("user_tokens").upsert(
    {
      user_id: userId,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: new Date(expiresAt * 1000).toISOString(),
    },
    {
      onConflict: "user_id",
    }
  );

  if (error) {
    throw new Error(`Failed to store tokens: ${error.message}`);
  }
}
