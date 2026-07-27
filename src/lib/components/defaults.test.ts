import { describe, expect, it } from "vitest";
import type { BikeConfig } from "@/lib/supabase/types";
import { createConfiguredComponents } from "./defaults";

const CONFIG: BikeConfig = {
  shifting_type: "mechanical",
  brake_type: "rim",
  drivetrain_speed: 11,
  tire_system: "clincher",
};

describe("createConfiguredComponents install distance", () => {
  const BIKE_KM = 5_000_000;

  it("first configuration assumes parts have been on since tracking began", () => {
    const parts = createConfiguredComponents("bike", "user", BIKE_KM, CONFIG);
    // Every part carries the bike's full distance, install baseline at zero —
    // the same shape as the sync-created defaults.
    for (const p of parts) {
      expect(p.current_distance).toBe(BIKE_KM);
      expect(p.bike_distance_at_install).toBe(0);
    }
  });

  it("re-configuration installs new parts at the current distance, zero wear", () => {
    const parts = createConfiguredComponents("bike", "user", BIKE_KM, CONFIG, {
      installedNow: true,
    });
    for (const p of parts) {
      expect(p.current_distance).toBe(0);
      expect(p.bike_distance_at_install).toBe(BIKE_KM);
    }
  });
});
