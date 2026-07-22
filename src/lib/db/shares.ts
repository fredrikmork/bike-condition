import { randomBytes } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Bike, BikeShare, Component } from "@/lib/supabase/types";

/**
 * Share links: one active link per bike, granting public read-only access to
 * that bike's summary. The token is the whole access control — 128 bits of
 * randomness, so it cannot be enumerated. Revoking never deletes the row;
 * a revoked link must keep resolving so the public page can say "this listing
 * is no longer available" instead of 404-ing ambiguously.
 */

/** Everything the public share page needs, resolved from a token. */
export interface SharedBikeData {
  share: BikeShare;
  bike: Bike;
  /** Active (unreplaced) components, containers included */
  components: Component[];
  /** Replaced components — the service history */
  history: Component[];
}

export async function getActiveShareForBike(
  bikeId: string,
  userId: string
): Promise<BikeShare | null> {
  const { data } = await supabaseAdmin
    .from("bike_shares")
    .select("*")
    .eq("bike_id", bikeId)
    .eq("user_id", userId)
    .is("revoked_at", null)
    .maybeSingle();

  return data;
}

export async function createShare(bikeId: string, userId: string): Promise<BikeShare | null> {
  const existing = await getActiveShareForBike(bikeId, userId);
  if (existing) return existing;

  const { data } = await supabaseAdmin
    .from("bike_shares")
    .insert({
      bike_id: bikeId,
      user_id: userId,
      token: randomBytes(16).toString("base64url"),
    })
    .select()
    .single();

  return data;
}

export async function revokeShare(bikeId: string, userId: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("bike_shares")
    .update({ revoked_at: new Date().toISOString() })
    .eq("bike_id", bikeId)
    .eq("user_id", userId)
    .is("revoked_at", null);

  return !error;
}

/**
 * Resolve a share token to the data the public page shows.
 *
 * Returns null for unknown tokens and `{ share, bike: null }`-shaped absence
 * distinctly: a revoked share resolves with `revoked` so the page can say so.
 */
export async function getSharedBike(
  token: string
): Promise<{ revoked: true } | SharedBikeData | null> {
  const { data: share } = await supabaseAdmin
    .from("bike_shares")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (!share) return null;
  if (share.revoked_at) return { revoked: true };

  const { data: bike } = await supabaseAdmin
    .from("bikes")
    .select("*")
    .eq("id", share.bike_id)
    .single();

  if (!bike) return null;

  const { data: allComponents } = await supabaseAdmin
    .from("components")
    .select("*")
    .eq("bike_id", share.bike_id)
    .order("type");

  const components = (allComponents ?? []).filter((c) => !c.replaced_at && !c.muted);
  const history = (allComponents ?? []).filter((c) => c.replaced_at !== null);

  return { share, bike, components, history };
}
