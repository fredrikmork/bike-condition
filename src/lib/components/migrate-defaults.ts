import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Maps component type → [old default value, new default value] in meters.
 * Only entries where the value changed are listed.
 * Components where recommended_distance still matches the old default
 * are considered "unmodified by the user" and will be updated.
 */
const MIGRATIONS: Array<{ type: string; oldDistance: number; newDistance: number }> = [
  { type: "cassette", oldDistance: 10_000_000, newDistance: 15_000_000 },
  { type: "chainrings", oldDistance: 15_000_000, newDistance: 25_000_000 },
  { type: "bottom_bracket", oldDistance: 10_000_000, newDistance: 15_000_000 },
  { type: "pulley_wheels", oldDistance: 20_000_000, newDistance: 15_000_000 },
  { type: "tire_front", oldDistance: 5_000_000, newDistance: 10_000_000 },
  { type: "tire_rear", oldDistance: 4_000_000, newDistance: 6_000_000 },
  { type: "brake_pads_front", oldDistance: 1_500_000, newDistance: 3_500_000 },
  { type: "brake_pads_rear", oldDistance: 1_500_000, newDistance: 3_500_000 },
  { type: "brake_pads_front", oldDistance: 3_000_000, newDistance: 5_000_000 }, // rim brakes old default
  { type: "brake_pads_rear", oldDistance: 3_000_000, newDistance: 5_000_000 },
  { type: "brake_rotor_front", oldDistance: 20_000_000, newDistance: 25_000_000 },
  { type: "brake_rotor_rear", oldDistance: 20_000_000, newDistance: 25_000_000 },
  { type: "brake_cables", oldDistance: 5_000_000, newDistance: 12_000_000 },
  { type: "shifter_cables", oldDistance: 5_000_000, newDistance: 10_000_000 },
  { type: "inner_tube_front", oldDistance: 3_000_000, newDistance: 5_000_000 },
  { type: "inner_tube_rear", oldDistance: 2_000_000, newDistance: 4_000_000 },
];

/**
 * Updates recommended_distance for any component still using an old default value.
 * Safe to run multiple times — only matches exact old default values.
 */
export async function migrateDefaultDistances(): Promise<void> {
  await Promise.all(
    MIGRATIONS.map(({ type, oldDistance, newDistance }) =>
      supabaseAdmin
        .from("components")
        .update({ recommended_distance: newDistance })
        .eq("type", type)
        .eq("recommended_distance", oldDistance)
    )
  );
}
