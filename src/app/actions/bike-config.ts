"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createConfiguredComponents } from "@/lib/components/defaults";
import { BIKE_TYPES } from "@/lib/bikes/types";
import type { BikeConfig } from "@/lib/supabase/types";
import type { BikeType } from "@/lib/bikes/types";

const BikeConfigSchema = z.object({
  shifting_type:    z.enum(["mechanical", "electronic"]),
  brake_type:       z.enum(["disc", "rim"]),
  drivetrain_speed: z.number().int().min(8).max(13),
  tire_system:      z.enum(["tubeless", "clincher", "tubular"]),
  bike_type:        z.enum(BIKE_TYPES).nullable().optional(),
});

export async function saveBikeConfigAction(
  bikeId: string,
  config: BikeConfig,
  bikeType?: BikeType | null
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.userId) return { success: false, error: "Not authenticated" };

  const parsed = BikeConfigSchema.safeParse({ ...config, bike_type: bikeType });
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
  const updatePayload: Record<string, unknown> = {
    shifting_type:    parsed.data.shifting_type,
    brake_type:       parsed.data.brake_type,
    drivetrain_speed: parsed.data.drivetrain_speed,
    tire_system:      parsed.data.tire_system,
    config_complete:  true,
  };
  if (parsed.data.bike_type !== undefined) {
    updatePayload.bike_type = parsed.data.bike_type;
  }

  const { error: updateError } = await supabaseAdmin
    .from("bikes")
    .update(updatePayload)
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
