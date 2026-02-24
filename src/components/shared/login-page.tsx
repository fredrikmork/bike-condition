"use client";

import { signIn } from "next-auth/react";
import {
  Bike,
  RefreshCw,
  Bell,
  History,
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StravaIcon } from "./strava-icon";

const features = [
  {
    icon: RefreshCw,
    title: "Automatic Strava sync",
    description: "Every ride updates your component wear instantly.",
  },
  {
    icon: TrendingUp,
    title: "Visual wear tracking",
    description: "Color-coded progress bars show exactly how much life is left.",
  },
  {
    icon: Bell,
    title: "Needs Attention alerts",
    description: "Critical parts surface in the sidebar before they let you down.",
  },
  {
    icon: History,
    title: "Replacement history",
    description: "A full log of every part replaced and how long it lasted.",
  },
  {
    icon: Bike,
    title: "All your bikes",
    description: "Road bike, trainer, gravel — each tracked separately.",
  },
  {
    icon: ShieldCheck,
    title: "Trainer-aware",
    description: "Indoor rides won't rack up false wear on your outdoor wheels.",
  },
];

export function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bike className="h-5 w-5" />
          </div>
          <span className="text-xl font-semibold tracking-tight">Bike Condition</span>
        </div>

        {/* Headline */}
        <h1 className="mb-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Know your bike
          <br />
          <span className="text-muted-foreground">inside out.</span>
        </h1>
        <p className="mb-8 max-w-lg text-base text-muted-foreground">
          Connect Strava and get automatic wear tracking for every component —
          so you always know what needs attention before it becomes a problem.
        </p>

        {/* Features */}
        <ul className="mb-8 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          {features.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="text-sm">
                <span className="font-medium">{title}</span>
                <span className="text-muted-foreground"> — {description}</span>
              </span>
            </li>
          ))}
        </ul>

        {/* Divider */}
        <div className="mb-6 border-t" />

        {/* CTA */}
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <Button
            size="lg"
            className="bg-[#fc4c02] text-white hover:bg-[#e34402]"
            onClick={() => signIn("strava")}
          >
            <StravaIcon className="mr-2 h-5 w-5" />
            Connect with Strava
          </Button>
          <p className="text-xs text-muted-foreground">
            Read-only access to rides and gear.
            <br className="hidden sm:block" />
            {" "}We never post on your behalf.
          </p>
        </div>
      </div>
    </div>
  );
}
