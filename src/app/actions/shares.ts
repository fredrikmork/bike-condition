"use server";

import { track } from "@vercel/analytics/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { getBikeById } from "@/lib/db/queries";
import { createShare, getActiveShareForBike, revokeShare } from "@/lib/db/shares";

/**
 * Create (or return the existing) public share link for a bike.
 *
 * One active link per bike: sharing twice hands back the same URL, so a link
 * already pasted into a listing stays valid instead of silently rotating.
 */
export async function createShareAction(
  bikeId: string
): Promise<{ success: boolean; error?: string; url?: string }> {
  const session = await auth();
  if (!session?.userId) return { success: false, error: "Not authenticated" };

  const bike = await getBikeById(bikeId, session.userId);
  if (!bike) return { success: false, error: "Bike not found" };

  const share = await createShare(bikeId, session.userId);
  if (!share) return { success: false, error: "Failed to create share link" };

  await track("bike_share_created");

  return { success: true, url: `/share/${share.token}` };
}

export async function getShareAction(
  bikeId: string
): Promise<{ success: boolean; error?: string; url?: string | null }> {
  const session = await auth();
  if (!session?.userId) return { success: false, error: "Not authenticated" };

  const share = await getActiveShareForBike(bikeId, session.userId);
  return { success: true, url: share ? `/share/${share.token}` : null };
}

/** Kill the link — the public page starts answering "no longer available". */
export async function revokeShareAction(
  bikeId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.userId) return { success: false, error: "Not authenticated" };

  const revoked = await revokeShare(bikeId, session.userId);
  if (!revoked) return { success: false, error: "Failed to revoke share link" };

  await track("bike_share_revoked");

  revalidatePath("/");
  return { success: true };
}
