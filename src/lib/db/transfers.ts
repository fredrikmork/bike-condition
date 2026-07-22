import { randomBytes } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Bike, BikeTransfer, Component } from "@/lib/supabase/types";

/**
 * Transferring a bike hands the whole thing to another user: the bike row,
 * every component that ever sat on it (replaced ones included — that IS the
 * service history), and the virtual periods. The seller's activities stay the
 * seller's; wear maths never needed them to move, because activities are
 * looked up by bike_id and closed mount periods are self-contained via their
 * distance snapshots.
 *
 * The bike arrives unlinked (strava_gear_id NULL) — the seller's gear id
 * means nothing in the buyer's Strava. Linking is the buyer's follow-up step,
 * guided by the banner on the bike page.
 */

export type TransferState =
  | { state: "invalid" }
  | { state: "expired"; transfer: BikeTransfer }
  | { state: "cancelled"; transfer: BikeTransfer }
  | { state: "accepted"; transfer: BikeTransfer }
  | {
      state: "open";
      transfer: BikeTransfer;
      bike: Bike;
      components: Component[];
      history: Component[];
    };

export async function getActiveTransferForBike(
  bikeId: string,
  sellerUserId: string
): Promise<BikeTransfer | null> {
  const { data } = await supabaseAdmin
    .from("bike_transfers")
    .select("*")
    .eq("bike_id", bikeId)
    .eq("seller_user_id", sellerUserId)
    .is("accepted_at", null)
    .is("cancelled_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

export async function createTransfer(bike: Bike): Promise<BikeTransfer | null> {
  const existing = await getActiveTransferForBike(bike.id, bike.user_id);
  if (existing) return existing;

  const { data } = await supabaseAdmin
    .from("bike_transfers")
    .insert({
      bike_id: bike.id,
      seller_user_id: bike.user_id,
      seller_strava_gear_id: bike.strava_gear_id,
      token: randomBytes(16).toString("base64url"),
    })
    .select()
    .single();

  return data;
}

export async function cancelTransfer(bikeId: string, sellerUserId: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("bike_transfers")
    .update({ cancelled_at: new Date().toISOString() })
    .eq("bike_id", bikeId)
    .eq("seller_user_id", sellerUserId)
    .is("accepted_at", null)
    .is("cancelled_at", null);

  return !error;
}

/** Resolve a transfer token to its state and, when open, the preview data. */
export async function getTransferByToken(token: string): Promise<TransferState> {
  const { data: transfer } = await supabaseAdmin
    .from("bike_transfers")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (!transfer) return { state: "invalid" };
  if (transfer.accepted_at) return { state: "accepted", transfer };
  if (transfer.cancelled_at) return { state: "cancelled", transfer };
  if (new Date(transfer.expires_at) < new Date()) return { state: "expired", transfer };

  const { data: bike } = await supabaseAdmin
    .from("bikes")
    .select("*")
    .eq("id", transfer.bike_id)
    .single();

  if (!bike) return { state: "invalid" };

  const { data: allComponents } = await supabaseAdmin
    .from("components")
    .select("*")
    .eq("bike_id", transfer.bike_id)
    .order("type");

  return {
    state: "open",
    transfer,
    bike,
    components: (allComponents ?? []).filter((c) => !c.replaced_at && !c.muted),
    history: (allComponents ?? []).filter((c) => c.replaced_at !== null),
  };
}

/**
 * Move the bike and everything on it to the buyer.
 *
 * No transactions, so the write order is chosen to fail safe: the bike row
 * flips owner LAST. Until that final write the buyer sees nothing and the
 * seller still sees the bike, so an interruption leaves a bike whose
 * components already answer to the buyer — invisible to both dashboards but
 * fully repaired by accepting again, which is why every step is idempotent.
 */
export async function acceptTransfer(
  transfer: BikeTransfer,
  buyerUserId: string
): Promise<{ success: boolean; error?: string }> {
  const bikeId = transfer.bike_id;

  // Component ids first — notification_log has no bike_id of its own.
  const { data: componentRows } = await supabaseAdmin
    .from("components")
    .select("id")
    .eq("bike_id", bikeId);
  const componentIds = (componentRows ?? []).map((c) => c.id);

  // 1. The buyer must not inherit the seller's already-notified thresholds —
  //    their first sync should alert them about anything already worn.
  if (componentIds.length > 0) {
    await supabaseAdmin.from("notification_log").delete().in("component_id", componentIds);

    // 2. Every part that ever sat on this bike, service history included.
    const { error: compErr } = await supabaseAdmin
      .from("components")
      .update({ user_id: buyerUserId })
      .eq("bike_id", bikeId);
    if (compErr) return { success: false, error: `Failed to move components: ${compErr.message}` };
  }

  // 3. Trainer periods belong to the bike's story.
  await supabaseAdmin
    .from("virtual_periods")
    .update({ user_id: buyerUserId })
    .eq("bike_id", bikeId);

  // 4. The bike is sold — its sale listing has served its purpose.
  await supabaseAdmin
    .from("bike_shares")
    .update({ revoked_at: new Date().toISOString() })
    .eq("bike_id", bikeId)
    .is("revoked_at", null);

  // 5. The bike itself, unlinked from the seller's Strava. This is the write
  //    that makes the transfer visible to both parties.
  const { error: bikeErr } = await supabaseAdmin
    .from("bikes")
    .update({ user_id: buyerUserId, strava_gear_id: null, retired: false })
    .eq("id", bikeId);
  if (bikeErr) return { success: false, error: `Failed to move bike: ${bikeErr.message}` };

  // 6. Close the invite. If this single write fails the link stays open, but
  //    re-accepting is harmless — every step above is idempotent.
  await supabaseAdmin
    .from("bike_transfers")
    .update({ accepted_at: new Date().toISOString(), buyer_user_id: buyerUserId })
    .eq("id", transfer.id);

  return { success: true };
}
