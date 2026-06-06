"use client";

import { useState, useTransition } from "react";
import { Mail } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { saveUserEmail } from "@/app/actions/user";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail: string | null;
}

export function EmailSettingsDialog({ open, onOpenChange, currentEmail }: Props) {
  const [email, setEmail] = useState(currentEmail ?? "");
  const [prevCurrentEmail, setPrevCurrentEmail] = useState(currentEmail);
  if (prevCurrentEmail !== currentEmail) {
    setPrevCurrentEmail(currentEmail);
    setEmail(currentEmail ?? "");
  }

  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await saveUserEmail(email);
      if (result.success) {
        setSaved(true);
        setTimeout(() => onOpenChange(false), 800);
      } else {
        setError(result.error ?? "Noe gikk galt");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-sm"
        onOpenAutoFocus={(e) => {
          if (currentEmail) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email notifications
          </DialogTitle>
          <DialogDescription>
            Add your email address to receive alerts when components are approaching their replacement limit.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          {saved && <p className="text-sm text-green-500">Saved!</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending || !email}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
