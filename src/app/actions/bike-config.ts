"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { isContainerType } from "@/lib/components/containers";
import { createConfiguredComponents } from "@/lib/components/defaults";
import { createComponentsWithMounts } from "@/lib/components/mounts";
import { isComponentVisible } from "@/lib/components/visibility";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { BikeConfig } from "@/lib/supabase/types";

const BikeConfigSchema = z.object({
  shifting_type: z.enum(["mechanical", "electronic"]),
  brake_type: z.enum(["disc", "rim"]),
  drivetrain_speed: z.number().int().min(8).max(13),
  tire_system: z.enum(["tubeless", "clincher", "tubular"]),
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
    .select("id, total_distance, deleted_defaults, config_complete")
    .eq("id", bikeId)
    .eq("user_id", session.userId)
    .single();

  if (!bike) return { success: false, error: "Bike not found" };

  // A re-configuration, not the first setup. Parts added now are genuinely new
  // (see createConfiguredComponents), and parts the new config no longer allows
  // must not linger as hidden zombies (see the prune step below).
  const isReconfig = bike.config_complete === true;

  // Save configuration
  const { error: updateError } = await supabaseAdmin
    .from("bikes")
    .update({
      shifting_type: parsed.data.shifting_type,
      brake_type: parsed.data.brake_type,
      drivetrain_speed: parsed.data.drivetrain_speed,
      tire_system: parsed.data.tire_system,
      config_complete: true,
      ...(config.electronic_system != null ? { electronic_system: config.electronic_system } : {}),
    })
    .eq("id", bikeId);

  if (updateError) return { success: false, error: updateError.message };

  // Existing active components (full rows — needed to tell a pristine default
  // apart from one the user has invested in).
  const { data: existingComponents } = await supabaseAdmin
    .from("components")
    .select("id, type, brand, model, spec, nickname, notes, lube_type, muted")
    .eq("bike_id", bikeId)
    .is("replaced_at", null);

  const existingTypes = new Set(existingComponents?.map((c) => c.type) ?? []);
  const deletedDefaults = new Set(bike.deleted_defaults ?? []);

  // Generate config-aware defaults and insert only missing types. On a
  // re-config the new parts install at the bike's current distance.
  const allConfigured = createConfiguredComponents(
    bikeId,
    session.userId,
    bike.total_distance ?? 0,
    parsed.data,
    { installedNow: isReconfig }
  );
  const toInsert = allConfigured.filter(
    (c) => !existingTypes.has(c.type) && !deletedDefaults.has(c.type)
  );

  await createComponentsWithMounts(toInsert);

  // Prune components the new config no longer allows (rotors after switching to
  // rim, tubes after going tubeless, …). Without this they persist as hidden
  // rows that still accrue wear and would reappear if the config flips back.
  // Only pristine auto-defaults are removed — a part the user has renamed,
  // branded, noted, or replaced is kept (still hidden) so nothing they invested
  // in is lost.
  const { data: typesWithHistory } = await supabaseAdmin
    .from("components")
    .select("type")
    .eq("bike_id", bikeId)
    .not("replaced_at", "is", null);
  const historyTypes = new Set((typesWithHistory ?? []).map((r) => r.type));

  const toPrune = (existingComponents ?? []).filter((c) => {
    if (isComponentVisible(c.type, parsed.data)) return false; // still valid
    if (isContainerType(c.type) || c.type === "custom") return false;
    if (historyTypes.has(c.type)) return false; // has a replacement trail
    return (
      c.brand == null &&
      c.model == null &&
      c.spec == null &&
      c.nickname == null &&
      c.notes == null &&
      c.lube_type == null &&
      c.muted === false
    );
  });

  if (toPrune.length > 0) {
    // Cascades to component_mounts and notification_log.
    await supabaseAdmin
      .from("components")
      .delete()
      .in(
        "id",
        toPrune.map((c) => c.id)
      );
  }

  revalidatePath("/");
  return { success: true };
}

export async function markChargedAction(
  bikeId: string,
  chargedAt: string,
  rangeKm?: number | null
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.userId) return { success: false, error: "Not authenticated" };

  const chargedDate = new Date(chargedAt);
  if (Number.isNaN(chargedDate.getTime())) {
    return { success: false, error: "Invalid date" };
  }

  // Normalise the optional warn-distance: positive integer km, or null to clear.
  let battery_range_km: number | null | undefined;
  if (rangeKm !== undefined) {
    battery_range_km = rangeKm != null && rangeKm > 0 ? Math.round(rangeKm) : null;
  }

  // Fetch current total_distance for this bike
  const { data: bike } = await supabaseAdmin
    .from("bikes")
    .select("total_distance")
    .eq("id", bikeId)
    .eq("user_id", session.userId)
    .single();

  if (!bike) return { success: false, error: "Bike not found" };

  const { error } = await supabaseAdmin
    .from("bikes")
    .update({
      last_charge_distance: bike.total_distance ?? 0,
      last_charge_date: chargedDate.toISOString(),
      ...(battery_range_km !== undefined ? { battery_range_km } : {}),
    })
    .eq("id", bikeId)
    .eq("user_id", session.userId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/");
  return { success: true };
}
