/**
 * One-time script to register the Strava webhook subscription.
 *
 * Run with:
 *   npx tsx scripts/setup-strava-webhook.ts
 *
 * Required env vars (from .env.local):
 *   STRAVA_CLIENT_ID
 *   STRAVA_CLIENT_SECRET
 *   STRAVA_WEBHOOK_VERIFY_TOKEN   – any secret string you choose
 *   NEXT_PUBLIC_APP_URL           – e.g. https://your-app.vercel.app
 */

import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const { STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_WEBHOOK_VERIFY_TOKEN, NEXT_PUBLIC_APP_URL } =
  process.env;

if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET || !STRAVA_WEBHOOK_VERIFY_TOKEN || !NEXT_PUBLIC_APP_URL) {
  console.error(
    "Missing required env vars: STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_WEBHOOK_VERIFY_TOKEN, NEXT_PUBLIC_APP_URL"
  );
  process.exit(1);
}

const callbackUrl = `${NEXT_PUBLIC_APP_URL}/api/strava/webhook`;

async function createSubscription() {
  console.log(`Creating Strava webhook subscription...`);
  console.log(`Callback URL: ${callbackUrl}`);

  const body = new URLSearchParams({
    client_id: STRAVA_CLIENT_ID!,
    client_secret: STRAVA_CLIENT_SECRET!,
    callback_url: callbackUrl,
    verify_token: STRAVA_WEBHOOK_VERIFY_TOKEN!,
  });

  const response = await fetch("https://www.strava.com/api/v3/push_subscriptions", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Failed to create subscription:", data);
    process.exit(1);
  }

  console.log("Subscription created successfully!");
  console.log(`Subscription ID: ${data.id}`);
  console.log(`\nAdd this to your Vercel env vars (optional, for deregistration):`);
  console.log(`STRAVA_WEBHOOK_SUBSCRIPTION_ID=${data.id}`);
}

async function listSubscriptions() {
  console.log("Fetching existing subscriptions...");

  const params = new URLSearchParams({
    client_id: STRAVA_CLIENT_ID!,
    client_secret: STRAVA_CLIENT_SECRET!,
  });

  const response = await fetch(
    `https://www.strava.com/api/v3/push_subscriptions?${params.toString()}`
  );
  const data = await response.json();

  if (Array.isArray(data) && data.length > 0) {
    console.log("Existing subscriptions:", JSON.stringify(data, null, 2));
    return data as Array<{ id: number; callback_url: string }>;
  }

  console.log("No existing subscriptions found.");
  return [];
}

async function deleteSubscription(id: number) {
  const params = new URLSearchParams({
    client_id: STRAVA_CLIENT_ID!,
    client_secret: STRAVA_CLIENT_SECRET!,
  });

  const response = await fetch(
    `https://www.strava.com/api/v3/push_subscriptions/${id}?${params.toString()}`,
    { method: "DELETE" }
  );

  if (response.status === 204) {
    console.log(`Deleted subscription ${id}`);
  } else {
    const data = await response.json();
    console.error(`Failed to delete subscription ${id}:`, data);
  }
}

async function main() {
  const arg = process.argv[2];

  if (arg === "list") {
    await listSubscriptions();
    return;
  }

  if (arg === "delete") {
    const idStr = process.argv[3];
    if (!idStr) {
      console.error("Usage: npx tsx scripts/setup-strava-webhook.ts delete <subscription_id>");
      process.exit(1);
    }
    await deleteSubscription(Number(idStr));
    return;
  }

  // Default: check for existing, then create
  const existing = await listSubscriptions();

  if (existing.length > 0) {
    const alreadyRegistered = existing.find((s) => s.callback_url === callbackUrl);
    if (alreadyRegistered) {
      console.log(`\nSubscription already exists for this URL (id: ${alreadyRegistered.id}). Nothing to do.`);
      return;
    }
    console.log(`\nNote: A subscription exists for a different URL. You may want to delete it first.`);
    console.log(`Run: npx tsx scripts/setup-strava-webhook.ts delete ${existing[0].id}`);
    return;
  }

  await createSubscription();
}

main().catch(console.error);
