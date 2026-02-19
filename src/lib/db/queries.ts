import { supabaseAdmin } from "@/lib/supabase/server";
import type { Bike, Component, ComponentInsert, User, SyncStatus, BikeWithComponents, LubeType } from "@/lib/supabase/types";

// User queries
export async function getUserById(userId: string): Promise<User | null> {
  const { data } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  return data;
}

export async function getUserByStravaId(stravaId: number): Promise<User | null> {
  const { data } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("strava_id", stravaId)
    .single();

  return data;
}

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

export async function getBikeWithComponents(bikeId: string): Promise<BikeWithComponents | null> {
  const { data: bike } = await supabaseAdmin
    .from("bikes")
    .select("*")
    .eq("id", bikeId)
    .single();

  if (!bike) return null;

  const { data: components } = await supabaseAdmin
    .from("components")
    .select("*")
    .eq("bike_id", bikeId)
    .is("replaced_at", null)
    .order("type");

  return {
    ...bike,
    components: components || [],
  };
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

export async function getPrimaryBike(userId: string): Promise<BikeWithComponents | null> {
  const { data: bike } = await supabaseAdmin
    .from("bikes")
    .select("*")
    .eq("user_id", userId)
    .eq("is_primary", true)
    .eq("retired", false)
    .single();

  if (!bike) return null;

  const { data: components } = await supabaseAdmin
    .from("components")
    .select("*")
    .eq("bike_id", bike.id)
    .is("replaced_at", null)
    .order("type");

  return {
    ...bike,
    components: components || [],
  };
}

// Component queries
export async function getComponentsForBike(bikeId: string): Promise<Component[]> {
  const { data } = await supabaseAdmin
    .from("components")
    .select("*")
    .eq("bike_id", bikeId)
    .is("replaced_at", null)
    .order("type");

  return data || [];
}

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
  await supabaseAdmin
    .from("components")
    .update({
      replaced_at: replacedIso,
      notes: notes || existing.notes,
    })
    .eq("id", componentId);

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

export async function getBikeById(bikeId: string): Promise<Bike | null> {
  const { data } = await supabaseAdmin
    .from("bikes")
    .select("*")
    .eq("id", bikeId)
    .single();

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

// Sync status queries
export async function getSyncStatus(userId: string): Promise<SyncStatus | null> {
  const { data } = await supabaseAdmin
    .from("sync_status")
    .select("*")
    .eq("user_id", userId)
    .single();

  return data;
}

// Summary stats
export async function getDashboardStats(userId: string): Promise<{
  totalBikes: number;
  totalDistance: number;
  componentsNeedingAttention: number;
  lastSync: string | null;
}> {
  const bikes = await getBikesForUser(userId);
  const totalDistance = bikes.reduce((sum, b) => sum + b.total_distance, 0);

  // Count components with wear >= 80%
  const bikeIds = bikes.map((b) => b.id);
  let componentsNeedingAttention = 0;

  if (bikeIds.length > 0) {
    const { data: components } = await supabaseAdmin
      .from("components")
      .select("current_distance, recommended_distance")
      .in("bike_id", bikeIds)
      .is("replaced_at", null);

    if (components) {
      componentsNeedingAttention = components.filter(
        (c) => c.current_distance / c.recommended_distance >= 0.8
      ).length;
    }
  }

  const syncStatus = await getSyncStatus(userId);

  return {
    totalBikes: bikes.length,
    totalDistance,
    componentsNeedingAttention,
    lastSync: syncStatus?.last_bike_sync || syncStatus?.last_activity_sync || null,
  };
}
