"use client";

import { ExternalLink, Link2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getLinkableGearAction, linkTransferredBikeAction } from "@/app/actions/transfers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface UnlinkedBikeBannerProps {
  bikeId: string;
  bikeName: string;
}

interface GearOption {
  id: string;
  name: string;
  distanceKm: number;
  alreadyTracked: string | null;
}

/**
 * Shown on a freshly transferred bike until its new owner links it to their
 * own Strava. This banner IS the onboarding for a received bike: it explains
 * why the numbers are frozen and walks through the three steps — add the bike
 * as gear on Strava, come back, pick it here.
 */
export function UnlinkedBikeBanner({ bikeId, bikeName }: UnlinkedBikeBannerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [gear, setGear] = useState<GearOption[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);

  async function loadGear() {
    setLoading(true);
    try {
      const result = await getLinkableGearAction();
      if (result.success && result.gear) {
        setGear(result.gear);
      } else {
        toast.error("Could not fetch your Strava gear", { description: result.error });
      }
    } finally {
      setLoading(false);
    }
  }

  function openDialog() {
    setDialogOpen(true);
    if (!gear) loadGear();
  }

  async function handleLink() {
    if (!selected) return;
    setLinking(true);
    try {
      const result = await linkTransferredBikeAction(bikeId, selected);
      if (result.success) {
        setDialogOpen(false);
        toast.success(`${bikeName} linked to your Strava`, {
          description: "New rides now count toward its wear — history intact.",
        });
      } else {
        toast.error("Could not link the bike", { description: result.error });
      }
    } finally {
      setLinking(false);
    }
  }

  const selectable = gear?.filter((g) => !g.alreadyTracked) ?? [];

  return (
    <>
      <div className="mb-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Link2 className="h-4 w-4 shrink-0" />
          Connect {bikeName} to your Strava
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          This bike came to you with its full service history, but it isn't linked to your Strava
          yet — distance and wear are frozen until it is.
        </p>
        <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-xs text-muted-foreground">
          <li>
            On Strava, add the bike to your gear:{" "}
            <a
              href="https://www.strava.com/settings/gear"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-0.5 font-medium text-foreground underline-offset-4 hover:underline"
            >
              Settings → My Gear → Add bike
              <ExternalLink className="h-3 w-3" />
            </a>
            . Give it a name you recognise — new rides should be tagged with it.
          </li>
          <li>Come back here and pick that bike below.</li>
          <li>Ride. Wear continues exactly where the previous owner left off.</li>
        </ol>
        <Button size="sm" className="mt-3 h-8" onClick={openDialog}>
          <Link2 className="mr-1.5 h-3.5 w-3.5" />
          Choose Strava bike
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Link {bikeName} to your Strava</DialogTitle>
            <DialogDescription>
              Pick which of your Strava bikes this is. If it isn't in the list, add it on Strava
              first (Settings → My Gear), then refresh.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2 py-1">
            {loading ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Fetching your Strava gear…
              </p>
            ) : !gear || gear.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No bikes found in your Strava gear yet. Add one on Strava, then refresh.
              </p>
            ) : (
              gear.map((g) => {
                const disabled = g.alreadyTracked !== null;
                return (
                  <button
                    key={g.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => setSelected(g.id)}
                    aria-pressed={selected === g.id}
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                      disabled
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer hover:bg-muted/50",
                      selected === g.id && "border-primary ring-1 ring-primary"
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{g.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {g.distanceKm.toLocaleString("nb-NO")} km on Strava
                      </span>
                    </span>
                    {disabled && (
                      <Badge variant="outline" className="shrink-0 text-[10px] font-normal">
                        Tracked as {g.alreadyTracked}
                      </Badge>
                    )}
                  </button>
                );
              })
            )}

            <Button
              variant="ghost"
              size="sm"
              className="h-7 justify-self-start text-xs text-muted-foreground"
              disabled={loading}
              onClick={loadGear}
            >
              <RefreshCw className={cn("mr-1.5 h-3 w-3", loading && "animate-spin")} />
              Refresh list
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={linking}>
              Cancel
            </Button>
            <Button
              onClick={handleLink}
              disabled={linking || !selected || !selectable.some((g) => g.id === selected)}
            >
              {linking ? "Linking…" : "Link bike"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
