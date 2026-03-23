import { after } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { syncActivities } from "@/lib/sync/activities";
import { syncBikes } from "@/lib/sync/bikes";
import { checkAndSendNotifications } from "@/lib/notifications";

// Strava sends this on GET to verify the endpoint during subscription setup
const HubChallengeSchema = z.object({
  "hub.mode": z.literal("subscribe"),
  "hub.verify_token": z.string(),
  "hub.challenge": z.string(),
});

// Strava sends this on POST for each event
const WebhookEventSchema = z.object({
  object_type: z.enum(["activity", "athlete"]),
  aspect_type: z.enum(["create", "update", "delete"]),
  object_id: z.number(),
  owner_id: z.number(), // Strava athlete ID
  subscription_id: z.number(),
  event_time: z.number(),
});

/**
 * GET /api/strava/webhook
 *
 * Strava calls this endpoint during webhook subscription setup to verify the URL.
 * We must respond with { "hub.challenge": "..." } from the query params.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const parsed = HubChallengeSchema.safeParse({
    "hub.mode": searchParams.get("hub.mode"),
    "hub.verify_token": searchParams.get("hub.verify_token"),
    "hub.challenge": searchParams.get("hub.challenge"),
  });

  if (!parsed.success) {
    return Response.json({ error: "Invalid hub challenge request" }, { status: 400 });
  }

  const verifyToken = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;
  if (!verifyToken || parsed.data["hub.verify_token"] !== verifyToken) {
    return Response.json({ error: "Invalid verify token" }, { status: 403 });
  }

  return Response.json({ "hub.challenge": parsed.data["hub.challenge"] });
}

/**
 * POST /api/strava/webhook
 *
 * Strava calls this endpoint for each new/updated/deleted activity.
 * We respond immediately and run the sync in the background via after().
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = WebhookEventSchema.safeParse(body);
  if (!parsed.success) {
    // Return 200 anyway — Strava will retry on non-2xx, and we don't want retry loops
    // for events we intentionally ignore (e.g. unknown object types)
    return Response.json({ ok: true });
  }

  const event = parsed.data;

  // Only handle cycling activity creates/updates
  if (event.object_type !== "activity" || event.aspect_type === "delete") {
    return Response.json({ ok: true });
  }

  // Look up our internal user ID from the Strava athlete ID
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("strava_id", event.owner_id)
    .single();

  if (!user) {
    // Unknown user — not an error on our end, just ignore
    return Response.json({ ok: true });
  }

  const userId = user.id;

  // Schedule the sync to run after the response is sent.
  // This keeps the response well within Strava's 2-second window.
  after(async () => {
    try {
      await syncActivities(userId, { fullSync: false });
      await syncBikes(userId);
      await checkAndSendNotifications(userId);
    } catch (error) {
      console.error(
        `[webhook] Sync failed for user ${userId}:`,
        error instanceof Error ? error.message : error
      );
    }
  });

  return Response.json({ ok: true });
}
