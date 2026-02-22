"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { VirtualPeriod } from "@/lib/supabase/types";

export async function getVirtualPeriodsAction(
  bikeId: string
): Promise<{ success: boolean; data?: VirtualPeriod[]; error?: string }> {
  const session = await auth();
  if (!session?.userId) return { success: false, error: "Not authenticated" };

  const { data, error } = await supabaseAdmin
    .from("virtual_periods")
    .select("*")
    .eq("bike_id", bikeId)
    .eq("user_id", session.userId)
    .order("start_date", { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as VirtualPeriod[] };
}

export async function addVirtualPeriodAction(
  bikeId: string,
  startDate: string,
  endDate: string | null
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.userId) return { success: false, error: "Not authenticated" };

  // Verify bike belongs to this user
  const { data: bike } = await supabaseAdmin
    .from("bikes")
    .select("id")
    .eq("id", bikeId)
    .eq("user_id", session.userId)
    .single();

  if (!bike) return { success: false, error: "Bike not found" };

  if (endDate && endDate <= startDate) {
    return { success: false, error: "End date must be after start date" };
  }

  const { error } = await supabaseAdmin.from("virtual_periods").insert({
    bike_id: bikeId,
    user_id: session.userId,
    start_date: startDate,
    end_date: endDate ?? null,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/");
  return { success: true };
}

export async function removeVirtualPeriodAction(
  periodId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.userId) return { success: false, error: "Not authenticated" };

  const { error } = await supabaseAdmin
    .from("virtual_periods")
    .delete()
    .eq("id", periodId)
    .eq("user_id", session.userId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/");
  return { success: true };
}
