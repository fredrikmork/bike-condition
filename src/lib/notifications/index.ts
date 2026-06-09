import { track } from "@vercel/analytics/server";
import { sendCriticalEmail, sendWarnEmail } from "@/lib/email";
import { canUseEmailNotifications } from "@/lib/notifications/access";
import { supabaseAdmin } from "@/lib/supabase/server";

const WARN_THRESHOLD = 80;
const CRITICAL_THRESHOLD = 100;

/**
 * Check all active components for the given user and send email
 * notifications when wear thresholds are crossed for the first time.
 *
 * Dedup: a unique index on (component_id, notification_type) in
 * notification_log ensures each threshold is only notified once per
 * component install. The log is cleared when a component is replaced.
 */
export async function checkAndSendNotifications(userId: string): Promise<void> {
  if (!canUseEmailNotifications(userId)) return;

  // Fetch user email
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("email, name")
    .eq("id", userId)
    .single();

  if (!user?.email) return; // Can't send without an email

  // Fetch all active (non-replaced, non-muted) components with their bike name
  const { data: components } = await supabaseAdmin
    .from("components")
    .select("id, name, type, current_distance, recommended_distance, bike_id, bikes(name)")
    .eq("bikes.user_id", userId)
    .is("replaced_at", null)
    .eq("muted", false)
    .not("current_distance", "is", null)
    .gt("recommended_distance", 0);

  if (!components || components.length === 0) return;

  // Fetch existing notification log for these components to avoid duplicates
  const componentIds = components.map((c) => c.id);
  const { data: existingLogs } = await supabaseAdmin
    .from("notification_log")
    .select("component_id, notification_type")
    .in("component_id", componentIds);

  const alreadyNotified = new Set(
    (existingLogs ?? []).map((l) => `${l.component_id}:${l.notification_type}`)
  );

  for (const component of components) {
    const bike = Array.isArray(component.bikes) ? component.bikes[0] : component.bikes;
    if (!bike) continue;

    const current = component.current_distance ?? 0;
    const recommended = component.recommended_distance;
    const wearPct = Math.round((current / recommended) * 100);

    const emailOptions = {
      to: user.email,
      componentName: component.name,
      bikeName: (bike as { name: string }).name,
      currentDistance: current,
      recommendedDistance: recommended,
      wearPct,
    };

    // Critical threshold (≥100%) — highest priority, send if not already sent
    if (wearPct >= CRITICAL_THRESHOLD && !alreadyNotified.has(`${component.id}:critical`)) {
      try {
        await sendCriticalEmail(emailOptions);
        await track("notification_sent", {
          type: "critical",
          component_type: component.type,
          wear_pct: wearPct,
        });
        await supabaseAdmin.from("notification_log").upsert(
          {
            user_id: userId,
            component_id: component.id,
            notification_type: "critical",
            wear_pct_at_send: wearPct,
          },
          { onConflict: "component_id,notification_type" }
        );
      } catch (err) {
        console.error(
          `[notifications] Failed to send critical email for component ${component.id}:`,
          err instanceof Error ? err.message : err
        );
      }
      continue; // Don't also send warn if already critical
    }

    // Warn threshold (≥80%) — send if not already sent (warn or critical)
    if (
      wearPct >= WARN_THRESHOLD &&
      !alreadyNotified.has(`${component.id}:warn`) &&
      !alreadyNotified.has(`${component.id}:critical`)
    ) {
      try {
        await sendWarnEmail(emailOptions);
        await track("notification_sent", {
          type: "warn",
          component_type: component.type,
          wear_pct: wearPct,
        });
        await supabaseAdmin.from("notification_log").upsert(
          {
            user_id: userId,
            component_id: component.id,
            notification_type: "warn",
            wear_pct_at_send: wearPct,
          },
          { onConflict: "component_id,notification_type" }
        );
      } catch (err) {
        console.error(
          `[notifications] Failed to send warn email for component ${component.id}:`,
          err instanceof Error ? err.message : err
        );
      }
    }
  }
}

/**
 * Clear notification log entries for a component when it is replaced.
 * This allows new notifications to be sent for the freshly installed component.
 */
export async function clearNotificationsForComponent(componentId: string): Promise<void> {
  await supabaseAdmin.from("notification_log").delete().eq("component_id", componentId);
}
