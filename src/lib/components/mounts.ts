import { getContainerTypeFor, isContainerType } from "@/lib/components/containers";
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

  // A tire created here belongs on its bike's front or rear wheel. Resolving
  // that afterwards keeps every creation site free of parent bookkeeping.
  const touchedBikeIds = new Set(
    created.map((c) => c.bike_id).filter((id): id is string => id !== null)
  );
  await Promise.all([...touchedBikeIds].map(linkPartsToContainers));

  return created;
}

/**
 * Point a bike's wheel parts at the wheel they sit on.
 *
 * The parent of a tire is fully determined by its type and its bike, so it can
 * always be resolved after the fact rather than threaded through every insert.
 * Only fills blanks — a part already assigned to a container is left alone.
 */
export async function linkPartsToContainers(bikeId: string): Promise<void> {
  const { data: components } = await supabaseAdmin
    .from("components")
    .select("id, type, parent_component_id")
    .eq("bike_id", bikeId)
    .is("replaced_at", null);

  if (!components) return;

  const containerIdByType = new Map(
    components.filter((c) => isContainerType(c.type)).map((c) => [c.type, c.id])
  );

  const updates = components.flatMap((component) => {
    if (component.parent_component_id) return [];
    const containerType = getContainerTypeFor(component.type);
    if (!containerType) return [];
    const containerId = containerIdByType.get(containerType);
    if (!containerId) return [];
    return [{ id: component.id, containerId }];
  });

  await Promise.all(
    updates.map((u) =>
      supabaseAdmin.from("components").update({ parent_component_id: u.containerId }).eq("id", u.id)
    )
  );
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

  // A part in the bank sits on no wheel; it picks up a new one when mounted.
  await supabaseAdmin
    .from("components")
    .update({ bike_id: null, parent_component_id: null })
    .eq("id", componentId);
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

  // The part landed on a different bike, so it hangs off that bike's wheel now.
  await linkPartsToContainers(bikeId);

  return { displaced };
}
