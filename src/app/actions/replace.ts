"use server";

import { auth } from "@/lib/auth/config";
import { replaceComponent, getComponentById } from "@/lib/db/queries";
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

  const newComponent = await replaceComponent(componentId, replacedDate);
  if (!newComponent) {
    return { success: false, error: "Failed to replace component" };
  }

  revalidatePath("/");

  return { success: true };
}
