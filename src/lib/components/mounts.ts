import { supabaseAdmin } from "@/lib/supabase/server";
import type { Component, ComponentInsert } from "@/lib/supabase/types";

/**
 * Every transition of a part between bikes and the bank goes through this
 * module. `components.bike_id` (where the part is now) and `component_mounts`
 * (where it has been) must agree, and keeping all writes in one place is what
 * makes that tractable — Supabase gives us no transactions to lean on. The
 * partial unique index `idx_component_mounts_one_open` is the backstop: a part
 * can never end up with two open mounts even if a call is interrupted.
 */

async function getBikeTotalDistance(bikeId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from("bikes")
    .select("total_distance")
    .eq("id", bikeId)
    .single();

  return data?.total_distance ?? 0;
}

/**
 * Insert components and their opening mount rows together.
 *
 * All four component-creation sites route through here (bike configuration,
 * manual add, new-bike defaults, and backfilled defaults during sync) so that
 * no part can be created without the mount row its wear calculation reads.
 */
export async function createComponentsWithMounts(inserts: ComponentInsert[]): Promise<Component[]> {
  if (inserts.length === 0) return [];

  const { data: created, error } = await supabaseAdmin.from("components").insert(inserts).select();

  if (error || !created) {
    throw new Error(`Failed to create components: ${error?.message ?? "unknown error"}`);
  }

  const mounts = created
    .filter((c) => c.bike_id !== null)
    .map((c) => ({
      component_id: c.id,
      bike_id: c.bike_id as string,
      mounted_at: c.installed_at,
      bike_distance_at_mount: c.bike_distance_at_install,
    }));

  if (mounts.length > 0) {
    await supabaseAdmin.from("component_mounts").insert(mounts);
  }

  return created;
}

/**
 * Close a part's open mount period without moving the part itself.
 *
 * Snapshots the bike's Strava total onto the mount so the period keeps its
 * gear-distance fallback once the part has moved on.
 *
 * Used on its own when a part is replaced: the worn part stays attached to the
 * bike so it still shows up in that bike's component history, but it stops
 * accumulating distance.
 */
export async function closeOpenMount(componentId: string, at: Date = new Date()): Promise<void> {
  const { data: openMount } = await supabaseAdmin
    .from("component_mounts")
    .select("id, bike_id")
    .eq("component_id", componentId)
    .is("unmounted_at", null)
    .maybeSingle();

  if (!openMount) return;

  await supabaseAdmin
    .from("component_mounts")
    .update({
      unmounted_at: at.toISOString(),
      bike_distance_at_unmount: await getBikeTotalDistance(openMount.bike_id),
    })
    .eq("id", openMount.id);
}

/** Close the open mount of a part and send it to the bank. */
export async function unmountComponent(componentId: string, at: Date = new Date()): Promise<void> {
  await closeOpenMount(componentId, at);

  await supabaseAdmin.from("components").update({ bike_id: null }).eq("id", componentId);
}

/**
 * Mount a part on a bike, displacing whatever part of the same type is already
 * there — that one goes to the bank. The card describes exactly this: choosing
 * a different cassette leaves the previous one unused until it is mounted
 * somewhere else.
 *
 * Returns the displaced component, if any, so callers can report it.
 */
export async function mountComponent(
  componentId: string,
  bikeId: string,
  at: Date = new Date()
): Promise<{ displaced: Component | null }> {
  const { data: component } = await supabaseAdmin
    .from("components")
    .select("*")
    .eq("id", componentId)
    .single();

  if (!component) throw new Error("Component not found");

  const { data: occupants } = await supabaseAdmin
    .from("components")
    .select("*")
    .eq("bike_id", bikeId)
    .eq("type", component.type)
    .is("replaced_at", null)
    .neq("id", componentId);

  const displaced = occupants?.[0] ?? null;
  for (const occupant of occupants ?? []) {
    await unmountComponent(occupant.id, at);
  }

  // Leave no stale open mount behind if the part was mounted elsewhere.
  await unmountComponent(componentId, at);

  await supabaseAdmin.from("component_mounts").insert({
    component_id: componentId,
    bike_id: bikeId,
    mounted_at: at.toISOString(),
    bike_distance_at_mount: await getBikeTotalDistance(bikeId),
  });

  await supabaseAdmin.from("components").update({ bike_id: bikeId }).eq("id", componentId);

  return { displaced };
}
