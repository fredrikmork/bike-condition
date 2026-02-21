"use server";

import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { addComponent, deleteComponent, getComponentById, getBikeById, addDeletedDefault, getComponentHistory, updateComponent } from "@/lib/db/queries";
import { revalidatePath } from "next/cache";
import type { LubeType, Component } from "@/lib/supabase/types";

const UpdateComponentSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  brand: z.string().max(100).nullable().optional(),
  model: z.string().max(100).nullable().optional(),
  spec: z.string().max(200).nullable().optional(),
  lube_type: z.enum(["wet_lube", "dry_lube", "drip_wax", "hot_wax"]).nullable().optional(),
  recommended_distance: z.number().int().positive("Distance must be greater than 0"),
  notes: z.string().max(500).nullable().optional(),
});

export async function addCustomComponentAction(
  bikeId: string,
  name: string,
  recommendedDistanceKm: number,
  icon?: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();

  if (!session?.userId) {
    return { success: false, error: "Not authenticated" };
  }

  if (!name.trim()) {
    return { success: false, error: "Name is required" };
  }

  if (recommendedDistanceKm <= 0) {
    return { success: false, error: "Distance must be greater than 0" };
  }

  const bike = await getBikeById(bikeId);
  if (!bike) {
    return { success: false, error: "Bike not found" };
  }

  const result = await addComponent({
    bike_id: bikeId,
    name: name.trim(),
    type: "custom",
    icon: icon || null,
    recommended_distance: recommendedDistanceKm * 1000, // km to meters
    current_distance: 0,
    bike_distance_at_install: bike.total_distance,
  });

  if (!result) {
    return { success: false, error: "Failed to add component" };
  }

  revalidatePath("/");

  return { success: true };
}

export async function updateComponentAction(
  componentId: string,
  data: {
    name: string;
    brand?: string | null;
    model?: string | null;
    spec?: string | null;
    lube_type?: LubeType | null;
    recommended_distance: number; // in meters
    notes?: string | null;
  }
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.userId) return { success: false, error: "Not authenticated" };

  const parsed = UpdateComponentSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const component = await getComponentById(componentId);
  if (!component) return { success: false, error: "Component not found" };

  const updated = await updateComponent(componentId, parsed.data);
  if (!updated) return { success: false, error: "Failed to update component" };

  revalidatePath("/");
  return { success: true };
}

export async function getComponentHistoryAction(
  bikeId: string,
  componentType: string
): Promise<{ success: boolean; history?: Component[]; error?: string }> {
  const session = await auth();
  if (!session?.userId) return { success: false, error: "Not authenticated" };

  const history = await getComponentHistory(bikeId, componentType);
  return { success: true, history };
}

export async function deleteComponentAction(
  componentId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();

  if (!session?.userId) {
    return { success: false, error: "Not authenticated" };
  }

  const component = await getComponentById(componentId);
  if (!component) {
    return { success: false, error: "Component not found" };
  }

  // For default components, record the type so sync won't re-add it
  if (component.type !== "custom") {
    await addDeletedDefault(component.bike_id, component.type);
  }

  const deleted = await deleteComponent(componentId);
  if (!deleted) {
    return { success: false, error: "Failed to delete component" };
  }

  revalidatePath("/");

  return { success: true };
}
