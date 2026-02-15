"use server";

import { auth } from "@/lib/auth/config";
import { addComponent, deleteComponent, getComponentById, getBikeById } from "@/lib/db/queries";
import { revalidatePath } from "next/cache";

export async function addCustomComponentAction(
  bikeId: string,
  name: string,
  recommendedDistanceKm: number
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

  if (component.type !== "custom") {
    return { success: false, error: "Only custom components can be deleted" };
  }

  const deleted = await deleteComponent(componentId);
  if (!deleted) {
    return { success: false, error: "Failed to delete component" };
  }

  revalidatePath("/");

  return { success: true };
}
