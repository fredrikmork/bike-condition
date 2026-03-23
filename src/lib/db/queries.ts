import { supabaseAdmin } from "@/lib/supabase/server";
import type { Bike, Component, ComponentInsert, SyncStatus, BikeWithComponents, LubeType } from "@/lib/supabase/types";

// Bike queries
export async function getBikesForUser(userId: string): Promise<Bike[]> {
  const { data } = await supabaseAdmin
    .from("bikes")
    .select("*")
    .eq("user_id", userId)
    .eq("retired", false)
    .order("is_primary", { ascending: false })
    .order("total_distance", { ascending: false });

  return data || [];
}

export async function getBikesWithComponents(userId: string): Promise<BikeWithComponents[]> {
  const bikes = await getBikesForUser(userId);
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

  // Create new component — distance = bike.total_distance - bike_distance_at_install
  const { data: newComponent } = await supabaseAdmin
    .from("components")
    .insert({
      bike_id: existing.bike_id,
      name: existing.name,
      type: existing.type,
      icon: existing.icon,
      recommended_distance: existing.recommended_distance,
      current_distance: 0,
      bike_distance_at_install: bikeDistance,
      installed_at: replacedIso,
    })
    .select()
    .single();

  return newComponent;
}

export async function addComponent(
  insert: ComponentInsert
): Promise<Component | null> {
  const { data } = await supabaseAdmin
    .from("components")
    .insert(insert)
    .select()
    .single();

  return data;
}

export async function updateComponent(
  componentId: string,
  data: {
    name: string;
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
  const { error } = await supabaseAdmin
    .from("components")
    .delete()
    .eq("id", componentId);

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
  let query = supabaseAdmin
    .from("bikes")
    .select("*")
    .eq("id", bikeId);

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

  const { data } = await supabaseAdmin
    .from("activities")
    .select("bike_id, distance")
    .in("bike_id", bikeIds)
    .eq("activity_type", "VirtualRide");

  const result: Record<string, number> = {};
  for (const row of data || []) {
    if (!row.bike_id) continue;
    result[row.bike_id] = (result[row.bike_id] ?? 0) + row.distance;
  }
  return result;
}

// User queries
export async function getUserEmail(userId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("users")
    .select("email")
    .eq("id", userId)
    .single();
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

