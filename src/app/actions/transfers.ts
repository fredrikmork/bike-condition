"use server";

import { track } from "@vercel/analytics/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { closeOpenMount } from "@/lib/components/mounts";
import { getBikeById } from "@/lib/db/queries";
import {
  acceptTransfer,
  cancelTransfer,
  createTransfer,
  getActiveTransferForBike,
  getTransferByToken,
} from "@/lib/db/transfers";
import { StravaClient } from "@/lib/strava/client";
import { getValidAccessToken } from "@/lib/strava/tokens";
import { supabaseAdmin } from "@/lib/supabase/server";
import { recomputeComponentDistances } from "@/lib/sync/bikes";

export async function createTransferAction(
  bikeId: string
): Promise<{ success: boolean; error?: string; url?: string }> {
  const session = await auth();
  if (!session?.userId) return { success: false, error: "Not authenticated" };

  const bike = await getBikeById(bikeId, session.userId);
  if (!bike) return { success: false, error: "Bike not found" };

  const transfer = await createTransfer(bike);
  if (!transfer) return { success: false, error: "Failed to create transfer link" };

  await track("bike_transfer_created");

  return { success: true, url: `/transfer/${transfer.token}` };
}

export async function getTransferForBikeAction(
  bikeId: string
): Promise<{ success: boolean; url?: string | null }> {
  const session = await auth();
  if (!session?.userId) return { success: false };

  const transfer = await getActiveTransferForBike(bikeId, session.userId);
  return { success: true, url: transfer ? `/transfer/${transfer.token}` : null };
}

export async function cancelTransferAction(
  bikeId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.userId) return { success: false, error: "Not authenticated" };

  const cancelled = await cancelTransfer(bikeId, session.userId);
  if (!cancelled) return { success: false, error: "Failed to cancel transfer" };

  revalidatePath("/");
  return { success: true };
}

/** The buyer accepts: the bike, its parts and its history change owner. */
export async function acceptTransferAction(
  token: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.userId) return { success: false, error: "Not authenticated" };

  const resolved = await getTransferByToken(token);
  if (resolved.state !== "open") {
    return { success: false, error: "This transfer is no longer open" };
  }
  if (resolved.transfer.seller_user_id === session.userId) {
    return { success: false, error: "You cannot accept your own transfer" };
  }

  const result = await acceptTransfer(resolved.transfer, session.userId);
  if (!result.success) return result;

  await track("bike_transfer_accepted");

  revalidatePath("/");
  return { success: true };
}

/**
 * The buyer's Strava gear, for the link-after-transfer picker.
 *
 * Fetched live from `/athlete` rather than from our bikes table so a gear the
 * buyer added on Strava minutes ago shows up without waiting for a sync.
 */
export async function getLinkableGearAction(): Promise<{
  success: boolean;
  error?: string;
  gear?: { id: string; name: string; distanceKm: number; alreadyTracked: string | null }[];
}> {
  const session = await auth();
  if (!session?.userId) return { success: false, error: "Not authenticated" };

  try {
    const accessToken = await getValidAccessToken(session.userId);
    const athlete = await new StravaClient(accessToken).getAthlete();

    const { data: bikes } = await supabaseAdmin
      .from("bikes")
      .select("name, strava_gear_id")
      .eq("user_id", session.userId)
      .not("strava_gear_id", "is", null);
    const trackedByGear = new Map((bikes ?? []).map((b) => [b.strava_gear_id, b.name]));

    return {
      success: true,
      gear: (athlete.bikes ?? []).map((g) => ({
        id: g.id,
        name: g.name,
        distanceKm: Math.round((g.distance ?? 0) / 1000),
        alreadyTracked: trackedByGear.get(g.id) ?? null,
      })),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch Strava gear",
    };
  }
}

/**
 * Link a transferred (unlinked) bike to one of the owner's own Strava gears.
 *
 * The mount machinery does the heavy lifting: every active part's open mount
 * is closed with the frozen pre-transfer distance snapshot, and a new mount
 * opens at the buyer's gear distance. Accumulated wear is preserved exactly,
 * and future rides accrue on the buyer's own scale.
 *
 * If the gear was already synced into a bike row of its own (the buyer synced
 * before linking), that fresh row is absorbed: its activities — rides on this
 * physical bike — move over, and the row plus its untouched default
 * components are deleted.
 */
export async function linkTransferredBikeAction(
  bikeId: string,
  gearId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.userId) return { success: false, error: "Not authenticated" };

  const bike = await getBikeById(bikeId, session.userId);
  if (!bike) return { success: false, error: "Bike not found" };
  if (bike.strava_gear_id) return { success: false, error: "Bike is already linked" };

  // The gear must actually exist in this user's Strava.
  let gearDistance = 0;
  try {
    const accessToken = await getValidAccessToken(session.userId);
    const athlete = await new StravaClient(accessToken).getAthlete();
    const gear = (athlete.bikes ?? []).find((g) => g.id === gearId);
    if (!gear) return { success: false, error: "That bike was not found in your Strava gear" };
    gearDistance = gear.distance ?? 0;
  } catch {
    return { success: false, error: "Could not reach Strava to verify the gear" };
  }

  // Absorb the duplicate row the gear may have synced into.
  const { data: duplicate } = await supabaseAdmin
    .from("bikes")
    .select("id")
    .eq("user_id", session.userId)
    .eq("strava_gear_id", gearId)
    .neq("id", bikeId)
    .maybeSingle();

  if (duplicate) {
    // Its rides happened on this physical bike — they belong to its history.
    await supabaseAdmin.from("activities").update({ bike_id: bikeId }).eq("bike_id", duplicate.id);
    // Its components are pristine defaults from the sync; the real parts came
    // with the transfer.
    await supabaseAdmin.from("components").delete().eq("bike_id", duplicate.id);
    await supabaseAdmin.from("bikes").delete().eq("id", duplicate.id);
  }

  // Cycle every active part's mount: close on the frozen seller-era scale,
  // reopen on the buyer's gear scale. Without this the buyer's (near-zero)
  // gear total would read as negative wear against seller-era offsets.
  const { data: activeComponents } = await supabaseAdmin
    .from("components")
    .select("id")
    .eq("bike_id", bikeId)
    .is("replaced_at", null);

  const now = new Date();
  for (const component of activeComponents ?? []) {
    await closeOpenMount(component.id, now);
  }
  if (activeComponents && activeComponents.length > 0) {
    await supabaseAdmin.from("component_mounts").insert(
      activeComponents.map((c) => ({
        component_id: c.id,
        bike_id: bikeId,
        mounted_at: now.toISOString(),
        bike_distance_at_mount: gearDistance,
      }))
    );
  }

  const { error: linkErr } = await supabaseAdmin
    .from("bikes")
    .update({ strava_gear_id: gearId, total_distance: gearDistance })
    .eq("id", bikeId);
  if (linkErr) return { success: false, error: `Failed to link bike: ${linkErr.message}` };

  // Fold any pre-link rides (absorbed above) into the wear numbers right away.
  await recomputeComponentDistances(session.userId);

  await track("bike_transfer_linked");

  revalidatePath("/");
  return { success: true };
}
