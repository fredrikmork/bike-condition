"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createConfiguredComponents } from "@/lib/components/defaults";
import type { BikeConfig } from "@/lib/supabase/types";

const BikeConfigSchema = z.object({
  shifting_type:    z.enum(["mechanical", "electronic"]),
  brake_type:       z.enum(["disc", "rim"]),
  drivetrain_speed: z.number().int().min(8).max(13),
  tire_system:      z.enum(["tubeless", "clincher", "tubular"]),
});

export async function saveBikeConfigAction(
  bikeId: string,
  config: BikeConfig
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.userId) return { success: false, error: "Not authenticated" };

  const parsed = BikeConfigSchema.safeParse(config);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid config" };
  }

  // Verify bike belongs to this user
  const { data: bike } = await supabaseAdmin
    .from("bikes")
    .select("id, total_distance, deleted_defaults")
    .eq("id", bikeId)
    .eq("user_id", session.userId)
    .single();

  if (!bike) return { success: false, error: "Bike not found" };

  // Save configuration
  const { error: updateError } = await supabaseAdmin
    .from("bikes")
    .update({
      shifting_type:    parsed.data.shifting_type,
      brake_type:       parsed.data.brake_type,
      drivetrain_speed: parsed.data.drivetrain_speed,
      tire_system:      parsed.data.tire_system,
      config_complete:  true,
    })
    .eq("id", bikeId);

  if (updateError) return { success: false, error: updateError.message };

  // Get existing active component types
  const { data: existingComponents } = await supabaseAdmin
    .from("components")
    .select("type")
    .eq("bike_id", bikeId)
    .is("replaced_at", null);

  const existingTypes = new Set(existingComponents?.map((c) => c.type) ?? []);
  const deletedDefaults = new Set(bike.deleted_defaults ?? []);

  // Generate config-aware defaults and insert only missing types
  const allConfigured = createConfiguredComponents(bikeId, bike.total_distance, parsed.data);
  const toInsert = allConfigured.filter(
    (c) => !existingTypes.has(c.type) && !deletedDefaults.has(c.type)
  );

  if (toInsert.length > 0) {
    await supabaseAdmin.from("components").insert(toInsert);
  }

  revalidatePath("/");
  return { success: true };
}
