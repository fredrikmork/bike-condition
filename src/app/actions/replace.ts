"use server";

import { auth } from "@/lib/auth/config";
import { replaceComponent, getComponentById, getBikeById } from "@/lib/db/queries";
import { revalidatePath } from "next/cache";

export async function replaceComponentAction(
  componentId: string,
  replacedAt: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();

  if (!session?.userId) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify the component exists
  const component = await getComponentById(componentId);
  if (!component) {
    return { success: false, error: "Component not found" };
  }

  const replacedDate = new Date(replacedAt);
  if (isNaN(replacedDate.getTime())) {
    return { success: false, error: "Invalid date" };
  }

  // Fetch the bike to get its current total_distance
  const bike = await getBikeById(component.bike_id);
  if (!bike) {
    return { success: false, error: "Bike not found" };
  }

  const newComponent = await replaceComponent(
    componentId,
    bike.total_distance,
    replacedDate
  );
  if (!newComponent) {
    return { success: false, error: "Failed to replace component" };
  }

  revalidatePath("/");

  return { success: true };
}
