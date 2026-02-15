"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { addCustomComponentAction } from "@/app/actions/components";

interface AddComponentDialogProps {
  bikeId: string;
}

export function AddComponentDialog({ bikeId }: AddComponentDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [distance, setDistance] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    const distanceKm = Number(distance);
    if (!name.trim() || !distanceKm || distanceKm <= 0) return;

    setLoading(true);
    try {
      const result = await addCustomComponentAction(bikeId, name, distanceKm);
      if (result.success) {
        toast.success(`${name} added`);
        setOpen(false);
        setName("");
        setDistance("");
      } else {
        toast.error("Failed to add component", {
          description: result.error,
        });
      }
    } catch {
      toast.error("Failed to add component", {
        description: "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7" title="Add custom component">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Custom Component</DialogTitle>
          <DialogDescription>
            Track a custom component on this bike. Set the name and recommended
            replacement distance.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="component-name">Component name</Label>
            <Input
              id="component-name"
              placeholder="e.g. Handlebar Tape"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="component-distance">
              Recommended replacement distance (km)
            </Label>
            <Input
              id="component-distance"
              type="number"
              min={1}
              placeholder="e.g. 5000"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={loading || !name.trim() || !distance || Number(distance) <= 0}
          >
            {loading ? "Adding..." : "Add Component"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
