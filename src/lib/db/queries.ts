import {
  closeOpenMount,
  createComponentsWithMounts,
  finalizeReplacedComponentDistance,
} from "@/lib/components/mounts";
import { fetchAllRows } from "@/lib/supabase/paginate";
import { supabaseAdmin } from "@/lib/supabase/server";
import type {
  Bike,
  BikeWithComponents,
  Component,
  ComponentInsert,
  LubeType,
  SyncStatus,
} from "@/lib/supabase/types";

// Bike queries
async function getBikesForUser(userId: string, retired: boolean): Promise<Bike[]> {
  const { data } = await supabaseAdmin
    .from("bikes")
    .select("*")
    .eq("user_id", userId)
    .eq("retired", retired)
    .order("total_distance", { ascending: false });

  return data || [];
}

export async function getBikesWithComponents(
  userId: string,
  { retired = false }: { retired?: boolean } = {}
): Promise<BikeWithComponents[]> {
  const bikes = await getBikesForUser(userId, retired);
  if (bikes.length === 0) return [];

  const bikeIds = bikes.map((b) => b.id);

  const { data: allComponents } = await supabaseAdmin
    .from("components")
    .select("*")
    .in("bike_id", bikeIds)
    .is("replaced_at", null)
    .order("type");

  const componentsByBike = new Map<string, Component[]>();
  for (const component of allComponents || []) {
    if (!component.bike_id) continue; // in the bank — no bike to group under
    const list = componentsByBike.get(component.bike_id) || [];
    list.push(component);
    componentsByBike.set(component.bike_id, list);
  }

  return bikes.map((bike) => ({
    ...bike,
    components: componentsByBike.get(bike.id) || [],
  }));
}

// Component queries
export async function getComponentById(componentId: string): Promise<Component | null> {
  const { data } = await supabaseAdmin
    .from("components")
    .select("*")
    .eq("id", componentId)
    .single();

  return data;
}

/**
 * Fetch a component only if it belongs to the user.
 *
 * Ownership hangs off the component itself rather than its bike, so this also
 * covers parts sitting in the bank with no bike attached.
 */
export async function getOwnedComponent(
  componentId: string,
  userId: string
): Promise<Component | null> {
  const { data } = await supabaseAdmin
    .from("components")
    .select("*")
    .eq("id", componentId)
    .eq("user_id", userId)
    .maybeSingle();

  return data;
}

/** A user's parts that are not mounted on any bike. */
export async function getBankedComponents(userId: string): Promise<Component[]> {
  const { data } = await supabaseAdmin
    .from("components")
    .select("*")
    .eq("user_id", userId)
    .is("bike_id", null)
    .is("replaced_at", null)
    .order("type");

  return data || [];
}

export async function replaceComponent(
  componentId: string,
  bikeDistance: number,
  replacedAt?: Date,
  notes?: string
): Promise<Component | null> {
  const existing = await getComponentById(componentId);
  if (!existing) return null;

  const replacedDate = replacedAt ?? new Date();
  const replacedIso = replacedDate.toISOString();

  // Mark old component as replaced
  const { error: retireErr } = await supabaseAdmin
    .from("components")
    .update({
      replaced_at: replacedIso,
      notes: notes !== undefined ? notes : existing.notes,
    })
    .eq("id", componentId);

  if (retireErr) throw new Error(`Failed to retire component: ${retireErr.message}`);

  // The worn part stops accumulating at the replacement date, but stays
  // attached to the bike so it remains visible in that bike's history. For a
  // backdated date the mount close reconstructs the bike's total at that date
  // from the activity record — today's total would be a lie.
  const snapshotAtReplacement = await closeOpenMount(componentId, replacedDate);

  // Freeze the worn part's distance honestly: recomputed over its now-closed
  // mount windows, so a replacement backdated to last autumn keeps only the
  // kilometres ridden by last autumn — not everything up to the click.
  await finalizeReplacedComponentDistance(componentId);

  // The new part starts on the same distance scale the old one ended on. With
  // today's total as baseline, a backdated install would start its gear
  // window in the future and undercount until the bike caught up.
  const [newComponent] = await createComponentsWithMounts([
    {
      bike_id: existing.bike_id,
      // A new tire goes back on the same wheel the worn one came off.
      parent_component_id: existing.parent_component_id,
      user_id: existing.user_id,
      name: existing.name,
      nickname: existing.nickname,
      type: existing.type,
      icon: existing.icon,
      recommended_distance: existing.recommended_distance,
      current_distance: 0,
      bike_distance_at_install: snapshotAtReplacement ?? bikeDistance,
      installed_at: replacedIso,
    },
  ]);

  return newComponent ?? null;
}

export async function addComponent(insert: ComponentInsert): Promise<Component | null> {
  const [created] = await createComponentsWithMounts([insert]);

  return created ?? null;
}

export async function updateComponent(
  componentId: string,
  data: {
    name: string;
    nickname?: string | null;
    brand?: string | null;
    model?: string | null;
    spec?: string | null;
    lube_type?: LubeType | null;
    recommended_distance: number;
    notes?: string | null;
  }
): Promise<Component | null> {
  const { data: updated } = await supabaseAdmin
    .from("components")
    .update({
      name: data.name,
      nickname: data.nickname ?? null,
      brand: data.brand ?? null,
      model: data.model ?? null,
      spec: data.spec ?? null,
      lube_type: data.lube_type ?? null,
      recommended_distance: data.recommended_distance,
      notes: data.notes ?? null,
    })
    .eq("id", componentId)
    .select()
    .single();

  return updated;
}

export async function getComponentHistory(
  bikeId: string,
  componentType: string
): Promise<Component[]> {
  const { data } = await supabaseAdmin
    .from("components")
    .select("*")
    .eq("bike_id", bikeId)
    .eq("type", componentType)
    .not("replaced_at", "is", null)
    .order("replaced_at", { ascending: false });

  return data || [];
}

export async function deleteComponent(componentId: string): Promise<boolean> {
  const { error } = await supabaseAdmin.from("components").delete().eq("id", componentId);

  return !error;
}

export async function addDeletedDefault(bikeId: string, componentType: string): Promise<void> {
  const { data: bike } = await supabaseAdmin
    .from("bikes")
    .select("deleted_defaults")
    .eq("id", bikeId)
    .single();

  if (!bike) return;

  const current = bike.deleted_defaults ?? [];
  if (current.includes(componentType)) return;

  await supabaseAdmin
    .from("bikes")
    .update({ deleted_defaults: [...current, componentType] })
    .eq("id", bikeId);
}

export async function getBikeById(bikeId: string, userId?: string): Promise<Bike | null> {
  let query = supabaseAdmin.from("bikes").select("*").eq("id", bikeId);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data } = await query.single();
  return data;
}

// Returns a map of bikeId → set of component types that have at least one retired entry.
// One query for all bikes — avoids N+1.
export async function getTypesWithHistoryForBikes(
  bikeIds: string[]
): Promise<Record<string, string[]>> {
  if (bikeIds.length === 0) return {};

  const { data } = await supabaseAdmin
    .from("components")
    .select("bike_id, type")
    .in("bike_id", bikeIds)
    .not("replaced_at", "is", null);

  const result: Record<string, string[]> = {};
  for (const row of data || []) {
    if (!row.bike_id) continue;
    if (!result[row.bike_id]) result[row.bike_id] = [];
    if (!result[row.bike_id].includes(row.type)) {
      result[row.bike_id].push(row.type);
    }
  }
  return result;
}

// Returns total VirtualRide distance (meters) per bike from activity history.
export async function getVirtualKmForBikes(bikeIds: string[]): Promise<Record<string, number>> {
  if (bikeIds.length === 0) return {};

  // Paged: a Zwift-heavy rider can pass PostgREST's 1000-row cap, which would
  // silently under-report the virtual total.
  const data = await fetchAllRows<{ bike_id: string | null; distance: number }>((from, to) =>
    supabaseAdmin
      .from("activities")
      .select("bike_id, distance")
      .in("bike_id", bikeIds)
      .eq("activity_type", "VirtualRide")
      .range(from, to)
  );

  const result: Record<string, number> = {};
  for (const row of data) {
    if (!row.bike_id) continue;
    result[row.bike_id] = (result[row.bike_id] ?? 0) + row.distance;
  }
  return result;
}

// User queries
export async function getUserEmail(userId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("email")
    .eq("id", userId)
    .single();
  if (error) console.error("[getUserEmail] query failed:", error.message, "| userId:", userId);
  return data?.email ?? null;
}

// Sync status queries
export async function getSyncStatus(userId: string): Promise<SyncStatus | null> {
  const { data } = await supabaseAdmin
    .from("sync_status")
    .select("*")
    .eq("user_id", userId)
    .single();

  return data;
}
