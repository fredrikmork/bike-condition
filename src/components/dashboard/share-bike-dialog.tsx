"use client";

import { Check, Copy, ExternalLink, Link2Off, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createShareAction, getShareAction, revokeShareAction } from "@/app/actions/shares";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ShareBikeDialogProps {
  bikeId: string;
  bikeName: string;
}

/**
 * Create and manage the public sale link for a bike. One active link per
 * bike; revoking it makes the public page answer "no longer available".
 */
export function ShareBikeDialog({ bikeId, bikeName }: ShareBikeDialogProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fullUrl = url ? `${window.location.origin}${url}` : null;

  // Look up any existing link when the dialog opens, so "Share" is idempotent
  // and a URL already sitting in a listing never rotates behind the owner's back.
  useEffect(() => {
    if (!open) return;
    getShareAction(bikeId).then((res) => {
      if (res.success) setUrl(res.url ?? null);
    });
  }, [open, bikeId]);

  async function handleCreate() {
    setLoading(true);
    try {
      const result = await createShareAction(bikeId);
      if (result.success && result.url) {
        setUrl(result.url);
      } else {
        toast.error("Failed to create share link", { description: result.error });
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

  async function handleRevoke() {
    setLoading(true);
    try {
      const result = await revokeShareAction(bikeId);
      if (result.success) {
        setUrl(null);
        toast.success("Share link revoked", {
          description: "The public page now shows the listing as unavailable.",
        });
      } else {
        toast.error("Failed to revoke link", { description: result.error });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="Share bike summary"
            onClick={() => setOpen(true)}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Share a read-only summary — for sale listings</TooltipContent>
      </Tooltip>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share {bikeName}</DialogTitle>
            <DialogDescription>
              Anyone with the link sees a read-only summary: components, wear and service history.
              Perfect for a sale listing. Your rides and personal details stay private.
            </DialogDescription>
          </DialogHeader>

          {url ? (
            <div className="grid gap-3 py-2">
              <div className="flex items-center gap-2">
                <Input readOnly value={fullUrl ?? ""} className="text-xs" />
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  aria-label="Copy link"
                  onClick={handleCopy}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
                  <a href={url} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                    Preview
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-destructive hover:text-destructive"
                  disabled={loading}
                  onClick={handleRevoke}
                >
                  <Link2Off className="mr-1.5 h-3.5 w-3.5" />
                  Revoke link
                </Button>
              </div>
            </div>
          ) : (
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={loading}>
                {loading ? "Creating…" : "Create share link"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
