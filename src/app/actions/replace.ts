"use server";

import { track } from "@vercel/analytics/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { getBikeById, getComponentById, replaceComponent } from "@/lib/db/queries";
import { clearNotificationsForComponent } from "@/lib/notifications";

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
  if (Number.isNaN(replacedDate.getTime())) {
    return { success: false, error: "Invalid date" };
  }

  // Fetch the bike (also verifies ownership)
  const bike = await getBikeById(component.bike_id, session.userId);
  if (!bike) {
    return { success: false, error: "Bike not found" };
  }

  const newComponent = await replaceComponent(componentId, bike.total_distance ?? 0, replacedDate);
  if (!newComponent) {
    return { success: false, error: "Failed to replace component" };
  }

  // Clear notification log so the freshly installed component can trigger new notifications
  await clearNotificationsForComponent(componentId);

  const wearPct =
    component.current_distance && component.recommended_distance
      ? Math.round((component.current_distance / component.recommended_distance) * 100)
      : 0;
  const daysInstalled = Math.round(
    (Date.now() - new Date(component.installed_at).getTime()) / 86400000
  );
  await track("component_replaced", {
    component_type: component.type,
    wear_pct: wearPct,
    days_installed: daysInstalled,
  });

  revalidatePath("/");

  return { success: true };
}
