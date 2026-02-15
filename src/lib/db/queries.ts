import { supabaseAdmin } from "@/lib/supabase/server";
import type { Bike, Component, User, SyncStatus, BikeWithComponents } from "@/lib/supabase/types";

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

export async function calculateDistanceFromActivities(
  bikeId: string,
  sinceDate: string
): Promise<number> {
  const { data } = await supabaseAdmin
    .from("activities")
    .select("distance")
    .eq("bike_id", bikeId)
    .gte("start_date", sinceDate);

  if (!data || data.length === 0) return 0;

  return data.reduce((sum, a) => sum + a.distance, 0);
}

export async function replaceComponent(
  componentId: string,
  replacedAt?: Date,
  notes?: string
): Promise<Component | null> {
  // Get the existing component
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

  // Calculate distance from activities since the replacement date
  const distanceSinceReplacement = await calculateDistanceFromActivities(
    existing.bike_id,
    replacedIso
  );

  // Create new component with same type
  const { data: newComponent } = await supabaseAdmin
    .from("components")
    .insert({
      bike_id: existing.bike_id,
      name: existing.name,
      type: existing.type,
      recommended_distance: existing.recommended_distance,
      current_distance: distanceSinceReplacement,
      installed_at: replacedIso,
    })
    .select()
    .single();

  return newComponent;
}

/**
 * Recalculate distances for all active components on a bike.
 * - Default components (installed_at ≈ created_at): use bike total distance
 * - Replaced components (installed_at ≠ created_at): sum activities since installed_at
 */
export async function recalculateComponentDistances(
  bikeId: string,
  bikeTotalDistance: number
): Promise<void> {
  const { data: components } = await supabaseAdmin
    .from("components")
    .select("id, installed_at, created_at")
    .eq("bike_id", bikeId)
    .is("replaced_at", null);

  if (!components || components.length === 0) return;

  await Promise.all(
    components.map(async (c) => {
      const installed = new Date(c.installed_at).getTime();
      const created = new Date(c.created_at).getTime();
      const isDefault = Math.abs(installed - created) < 60_000;

      let distance: number;
      if (isDefault) {
        // Original component — assume it's been on since the beginning
        distance = bikeTotalDistance;
      } else {
        // Replaced component — sum activities since installation
        distance = await calculateDistanceFromActivities(bikeId, c.installed_at);
      }

      await supabaseAdmin
        .from("components")
        .update({ current_distance: distance })
        .eq("id", c.id);
    })
  );
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
