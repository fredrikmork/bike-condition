/**
 * Feature access for email notifications.
 *
 * Resend runs in sandbox mode (no verified domain), so emails can only be
 * delivered to the Resend account owner's address. NOTIFICATIONS_USER_ALLOWLIST
 * (comma-separated user ids) limits the feature — both the configuration UI and
 * actual sending — to those users while that is the case. Remove the variable
 * once a domain is verified at resend.com/domains to open the feature for all.
 */
export function canUseEmailNotifications(userId: string | null | undefined): boolean {
  if (process.env.NOTIFICATIONS_ENABLED !== "true") return false;
  if (!userId) return false;

  const allowlist = (process.env.NOTIFICATIONS_USER_ALLOWLIST ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  return allowlist.length === 0 || allowlist.includes(userId);
}
