import { ArrowRight, Bike as BikeIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Header for the public pages (share link, transfer link) — the only
 * navigation those pages have, and the way a link recipient finds the app.
 */
export function PublicHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BikeIcon className="h-4 w-4" />
          </div>
          <span className="font-semibold tracking-tight">Bike Condition</span>
        </Link>
        <Button size="sm" variant="outline" asChild>
          <Link href="/">
            Track your bike
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </header>
  );
}
