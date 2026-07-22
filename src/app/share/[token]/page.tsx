import { Bike as BikeIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/share/public-header";
import { ShareSummary } from "@/components/share/share-summary";
import { Button } from "@/components/ui/button";
import { getSharedBike } from "@/lib/db/shares";
import { formatDistance } from "@/lib/wear/calculator";

/**
 * Public, token-gated read-only view of one bike — the link that goes in a
 * sale listing. No auth: the unguessable token is the access control. Always
 * rendered fresh so revocation takes effect immediately and the wear numbers
 * are current.
 *
 * The page is also the app's front door for whoever received the link, so it
 * carries its own header and CTA. Those live here and not in ShareSummary —
 * the transfer-preview screen reuses the summary and must not inherit them.
 */
export const dynamic = "force-dynamic";

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { token } = await params;
  const shared = await getSharedBike(token);

  if (!shared || "revoked" in shared) {
    return { title: "Bike Condition", robots: { index: false } };
  }

  const { bike, history } = shared;
  const subtitle = [bike.brand_name, bike.model_name].filter(Boolean).join(" ");
  const serviceLine =
    history.length > 0
      ? `${history.length} logged part replacement${history.length !== 1 ? "s" : ""}`
      : "full component wear overview";

  return {
    title: `${bike.name} — ${formatDistance(bike.total_distance ?? 0)}`,
    description: `${subtitle || bike.name}: ${serviceLine}, tracked with Bike Condition.`,
    robots: { index: false },
    openGraph: {
      title: `${bike.name} — ${formatDistance(bike.total_distance ?? 0)}`,
      description: `${subtitle || "Bike"} with documented service history — ${serviceLine}.`,
    },
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  const shared = await getSharedBike(token);

  if (!shared || "revoked" in shared) {
    return (
      <div className="flex min-h-screen flex-col">
        <PublicHeader />
        <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <BikeIcon aria-hidden="true" className="mb-4 h-10 w-10 text-muted-foreground/50" />
          <h1 className="text-lg font-semibold">This listing is no longer available</h1>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            The owner has removed this share link, or it never existed.
          </p>
          <Button variant="outline" size="sm" className="mt-5" asChild>
            <Link href="/">Go to Bike Condition</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
        <ShareSummary bike={shared.bike} components={shared.components} history={shared.history} />

        {/* Footer CTA — the buyer holding this link is the next user */}
        <div className="mt-8 border-t pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Service history tracked with{" "}
            <Link
              href="/"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Bike Condition
            </Link>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Buying this bike? Connect your Strava and keep the wear tracking going.
          </p>
        </div>
      </main>
    </div>
  );
}
