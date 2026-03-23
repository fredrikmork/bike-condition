"use server";

import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { supabaseAdmin } from "@/lib/supabase/server";

const EmailSchema = z.object({
  email: z.string().email("Ugyldig e-postadresse"),
});

export async function saveUserEmail(
  email: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.userId) return { success: false, error: "Not authenticated" };

  const parsed = EmailSchema.safeParse({ email });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { error } = await supabaseAdmin
    .from("users")
    .update({ email: parsed.data.email })
    .eq("id", session.userId);

  if (error) return { success: false, error: "Kunne ikke lagre e-post" };

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
