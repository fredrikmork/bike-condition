"use server";

import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { supabaseAdmin } from "@/lib/supabase/server";
import { track } from "@vercel/analytics/server";

const EmailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function saveUserEmail(
  email: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  const stravaId = session?.stravaId;
  if (!stravaId) return { success: false, error: "Not authenticated" };

  const parsed = EmailSchema.safeParse({ email });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { error, data: updated } = await supabaseAdmin
    .from("users")
    .update({ email: parsed.data.email })
    .eq("strava_id", stravaId)
    .select("id");

  if (error) {
    console.error("[saveUserEmail] update failed:", error.message, "stravaId:", stravaId);
    return { success: false, error: "Failed to save email" };
  }
  if (!updated || updated.length === 0) {
    console.error("[saveUserEmail] no rows matched stravaId:", stravaId);
    return { success: false, error: "User not found" };
  }

  await track("email_notifications_enabled");

  return { success: true };
}

export async function getUserEmail(): Promise<string | null> {
  const session = await auth();
  if (!session?.userId) return null;

  const { data } = await supabaseAdmin
    .from("users")
    .select("email")
    .eq("id", session.userId)
    .single();

  return data?.email ?? null;
}
