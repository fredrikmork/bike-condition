"use client";

import { useState, useEffect, useTransition } from "react";
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEmail(currentEmail ?? "");
  }, [currentEmail]);
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
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            E-postvarsler
          </DialogTitle>
          <DialogDescription>
            Legg til e-postadressen din for å motta varsler når komponenter nærmer seg
            utskiftningstid.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-2">
          <Label htmlFor="email">E-postadresse</Label>
          <Input
            id="email"
            type="email"
            placeholder="deg@eksempel.no"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          {saved && <p className="text-sm text-green-500">Lagret!</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleSave} disabled={isPending || !email}>
            {isPending ? "Lagrer…" : "Lagre"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
