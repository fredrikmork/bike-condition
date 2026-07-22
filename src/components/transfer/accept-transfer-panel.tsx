"use client";

import { ArrowRightLeft, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { acceptTransferAction } from "@/app/actions/transfers";
import { StravaIcon } from "@/components/shared/strava-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface AcceptTransferPanelProps {
  token: string;
  bikeName: string;
  /** null = not signed in; "seller" = viewing own link; "buyer" = can accept */
  viewer: "buyer" | "seller" | null;
}

/**
 * The action side of the transfer page. What it promises the buyer — and the
 * three steps after accepting — is the contract: the bike arrives with full
 * history but unlinked from Strava, and the banner on the bike page walks
 * them through linking it.
 */
export function AcceptTransferPanel({ token, bikeName, viewer }: AcceptTransferPanelProps) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);

  async function handleAccept() {
    setAccepting(true);
    try {
      const result = await acceptTransferAction(token);
      if (result.success) {
        toast.success(`${bikeName} is now yours`, {
          description: "Find it in your garage — next step is linking it to your Strava.",
        });
        router.push("/");
        router.refresh();
      } else {
        toast.error("Could not accept the transfer", { description: result.error });
        setAccepting(false);
      }
    } catch {
      toast.error("Could not accept the transfer");
      setAccepting(false);
    }
  }

  if (viewer === "seller") {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          This is your own transfer link — send it to the buyer. You can cancel it from the bike's
          share dialog until it is accepted.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <ArrowRightLeft className="h-4 w-4" />
          Take over this bike
        </h2>

        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          {[
            "The bike moves to your account with every component, its wear, and the full replacement history.",
            "The seller keeps their own rides — only the bike and its parts change hands.",
            "Afterwards you link the bike to your own Strava so new rides keep the tracking going. We'll walk you through it.",
          ].map((line) => (
            <li key={line} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{line}</span>
            </li>
          ))}
        </ul>

        {/* After accepting: the same three steps the in-app banner walks through.
            Shown here too so the buyer knows the plan before committing. */}
        <div className="mt-4 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">After you accept</p>
          <ol className="mt-1.5 list-decimal space-y-1 pl-4">
            <li>
              Add the bike to your own Strava gear (Settings → My Gear → Add bike), so your rides
              land on it.
            </li>
            <li>Open the bike here and pick that Strava bike in the banner on top.</li>
            <li>Ride — wear picks up right where the previous owner left off.</li>
          </ol>
        </div>

        <div className="mt-4">
          {viewer === "buyer" ? (
            <Button className="w-full" onClick={handleAccept} disabled={accepting}>
              {accepting ? "Transferring…" : `Accept ${bikeName}`}
            </Button>
          ) : (
            <Button
              className="w-full bg-[#fc4c02] text-white hover:bg-[#e34402]"
              onClick={() => signIn("strava", { callbackUrl: `/transfer/${token}` })}
            >
              <StravaIcon className="mr-2 h-4 w-4" />
              Sign in with Strava to accept
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
