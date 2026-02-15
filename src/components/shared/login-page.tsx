"use client";

import { signIn } from "next-auth/react";
import { Bike } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StravaIcon } from "./strava-icon";

export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bike className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Bike Condition</CardTitle>
          <CardDescription>
            Track your bike component wear and know when it&apos;s time for
            maintenance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full bg-[#fc4c02] text-white hover:bg-[#e34402]"
            onClick={() => signIn("strava")}
          >
            <StravaIcon className="mr-2 h-5 w-5" />
            Connect with Strava
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
