"use client";

import { signIn } from "next-auth/react";
import {
  Bike,
  RefreshCw,
  Bell,
  History,
  ShieldCheck,
  TrendingUp,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StravaIcon } from "./strava-icon";

const features = [
  {
    icon: RefreshCw,
    title: "Automatisk oppdatering fra Strava",
    description:
      "Hver tur du registrerer på Strava oppdaterer slitasjen på komponentene dine – helt uten manuell inntasting.",
  },
  {
    icon: TrendingUp,
    title: "Se slitasjen i sanntid",
    description:
      "Visuelle progressbarer viser deg nøyaktig hvor langt hver komponent er fra anbefalt byttetidspunkt.",
  },
  {
    icon: Bell,
    title: "Varsler om det som trenger oppmerksomhet",
    description:
      "Kritiske komponenter dukker opp i sidepanelet slik at du aldri blir overrasket av et havari på veien.",
  },
  {
    icon: History,
    title: "Full historikk",
    description:
      "Se når hver del ble byttet, hvor mange kilometer den holdt, og bygg opp en vedlikeholdslogg over tid.",
  },
  {
    icon: Bike,
    title: "Alle syklene dine – samlet",
    description:
      "Har du treningssykkel og racersykkel? Begge følges opp separat med egne komponentprofiler.",
  },
  {
    icon: ShieldCheck,
    title: "Tren uten å ødelegge statistikken",
    description:
      "Merk perioder på rulle eller indendørstrener slik at virtuelle turer ikke teller unødig slitasje på dekkene.",
  },
  {
    icon: LayoutDashboard,
    title: "Alt på ett sted",
    description:
      "Kjedeslitasje, kassett, dekk, bremser og mer – oversiktlig samlet i et rent dashbord uten støy.",
  },
];

export function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Left — feature content */}
      <div className="flex flex-1 flex-col justify-center px-8 py-16 lg:px-16 lg:py-24">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bike className="h-5 w-5" />
          </div>
          <span className="text-xl font-semibold tracking-tight">Bike Condition</span>
        </div>

        {/* Headline */}
        <h1 className="mb-4 text-4xl font-bold tracking-tight lg:text-5xl">
          Ta vare på sykkelen.
          <br />
          <span className="text-muted-foreground">Før det haster.</span>
        </h1>
        <p className="mb-10 max-w-lg text-lg text-muted-foreground">
          Koble Strava-kontoen din og få full oversikt over slitasjen på alle
          sykkelkomponenter – automatisk oppdatert etter hver tur.
        </p>

        {/* Feature list */}
        <ul className="grid gap-5 sm:grid-cols-2 lg:max-w-2xl">
          {features.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex gap-3">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium leading-snug">{title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Right — sign-in card */}
      <div className="flex items-center justify-center bg-muted/20 px-8 py-16 lg:w-[420px] lg:shrink-0 lg:px-12">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Bike className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl">Kom i gang gratis</CardTitle>
            <CardDescription>
              Logg inn med Strava for å synce syklene dine og begynne å spore
              komponentslitasje.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button
              className="w-full bg-[#fc4c02] text-white hover:bg-[#e34402]"
              onClick={() => signIn("strava")}
            >
              <StravaIcon className="mr-2 h-5 w-5" />
              Koble til Strava
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Vi leser kun aktivitets- og utstyrsdata. Vi publiserer aldri noe
              på Strava på dine vegne.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
