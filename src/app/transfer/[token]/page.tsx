import { ArrowRightLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/share/public-header";
import { ShareSummary } from "@/components/share/share-summary";
import { AcceptTransferPanel } from "@/components/transfer/accept-transfer-panel";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth/config";
import { getTransferByToken } from "@/lib/db/transfers";

/**
 * The buyer's side of a bike transfer. Anyone with the link can see the
 * preview (the same summary a sale listing shows); accepting requires signing
 * in with Strava, and the panel routes the signed-out visitor through OAuth
 * and back here.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bike transfer — Bike Condition",
  robots: { index: false },
};

interface TransferPageProps {
  params: Promise<{ token: string }>;
}

function ClosedMessage({ title, body }: { title: string; body: string }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <ArrowRightLeft aria-hidden="true" className="mb-4 h-10 w-10 text-muted-foreground/50" />
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      <Button variant="outline" size="sm" className="mt-5" asChild>
        <Link href="/">Go to Bike Condition</Link>
      </Button>
    </main>
  );
}

export default async function TransferPage({ params }: TransferPageProps) {
  const { token } = await params;
  const [resolved, session] = await Promise.all([getTransferByToken(token), auth()]);

  if (resolved.state !== "open") {
    const message =
      resolved.state === "accepted"
        ? {
            title: "This bike has been transferred",
            body:
              session?.userId && resolved.transfer.buyer_user_id === session.userId
                ? "It's in your garage — open Bike Condition to see it."
                : "The transfer is complete and this link has served its purpose.",
          }
        : resolved.state === "cancelled"
          ? {
              title: "This transfer was cancelled",
              body: "The owner withdrew the transfer. Ask them for a new link if this is unexpected.",
            }
          : resolved.state === "expired"
            ? {
                title: "This transfer link has expired",
                body: "Transfer links are valid for 7 days. Ask the owner to create a new one.",
              }
            : {
                title: "This transfer link is not valid",
                body: "Check that the link was copied in full, or ask the owner for a new one.",
              };

    return (
      <div className="flex min-h-screen flex-col">
        <PublicHeader />
        <ClosedMessage title={message.title} body={message.body} />
      </div>
    );
  }

  const viewer = !session?.userId
    ? null
    : session.userId === resolved.transfer.seller_user_id
      ? ("seller" as const)
      : ("buyer" as const);

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-6 py-8">
        <AcceptTransferPanel token={token} bikeName={resolved.bike.name} viewer={viewer} />
        <ShareSummary
          bike={resolved.bike}
          components={resolved.components}
          history={resolved.history}
        />
      </main>
    </div>
  );
}
