"use client";

import { Check, Copy, TriangleAlert, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  cancelTransferAction,
  createTransferAction,
  getTransferForBikeAction,
} from "@/app/actions/transfers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface TransferBikeDialogProps {
  bikeId: string;
  bikeName: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

/**
 * Seller's side of a transfer: mint the invite link, hand it to the buyer,
 * cancel while it is still open. The dialog is explicit about what leaves the
 * account — a transfer is the one action here that gives something away.
 */
export function TransferBikeDialog({
  bikeId,
  bikeName,
  open,
  onOpenChange,
}: TransferBikeDialogProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fullUrl = url ? `${window.location.origin}${url}` : null;

  useEffect(() => {
    if (!open) return;
    getTransferForBikeAction(bikeId).then((res) => {
      if (res.success) setUrl(res.url ?? null);
    });
  }, [open, bikeId]);

  async function handleCreate() {
    setLoading(true);
    try {
      const result = await createTransferAction(bikeId);
      if (result.success && result.url) {
        setUrl(result.url);
      } else {
        toast.error("Failed to create transfer link", { description: result.error });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!fullUrl) return;
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleCancel() {
    setLoading(true);
    try {
      const result = await cancelTransferAction(bikeId);
      if (result.success) {
        setUrl(null);
        toast.success("Transfer cancelled", {
          description: "The link no longer works. The bike stays yours.",
        });
      } else {
        toast.error("Failed to cancel transfer", { description: result.error });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer {bikeName}</DialogTitle>
          <DialogDescription>
            Hand the bike to its new owner — with every component, its wear and the full replacement
            history. They open the link, sign in with Strava and accept.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
          <p className="flex items-center gap-1.5 font-medium">
            <TriangleAlert className="h-3.5 w-3.5 text-amber-600" />
            This moves the bike out of your account
          </p>
          <p className="mt-1 text-muted-foreground">
            Your rides stay yours, and parts in your bank stay put. After the buyer accepts,
            remember to retire the bike in your own Strava gear. The link is valid for 7 days.
          </p>
        </div>

        {url ? (
          <div className="grid gap-3 py-1">
            <div className="flex items-center gap-2">
              <Input readOnly value={fullUrl ?? ""} className="text-xs" />
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                aria-label="Copy transfer link"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 justify-self-start text-xs text-destructive hover:text-destructive"
              disabled={loading}
              onClick={handleCancel}
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              Cancel transfer
            </Button>
          </div>
        ) : (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? "Creating…" : "Create transfer link"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
