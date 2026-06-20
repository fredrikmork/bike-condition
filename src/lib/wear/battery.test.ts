import { describe, expect, it } from "vitest";
import { getBatteryHealth } from "./battery";

// A recent creation date keeps the age-based degradation negligible for the
// auto-estimate cases; override cases pass an explicit range so age is ignored.
const RECENT = new Date().toISOString();
const OLD = "2010-01-01T00:00:00Z";

describe("getBatteryHealth — user range override", () => {
  it("uses the user-set range verbatim, ignoring system + bike age", () => {
    const h = getBatteryHealth(0, "di2", OLD, 600);
    expect(h.effectiveRange).toBe(600);
    expect(h.percent).toBe(100);
    expect(h.status).toBe("healthy");
  });

  it("falls back to the auto-estimate when range is null or non-positive", () => {
    expect(getBatteryHealth(0, "di2", RECENT, null).effectiveRange).toBeGreaterThan(0);
    expect(getBatteryHealth(0, "di2", RECENT, 0).effectiveRange).toBeGreaterThan(0);
  });
});

describe("getBatteryHealth — percent + thresholds (range 500)", () => {
  it("half consumed → 50% and healthy", () => {
    const h = getBatteryHealth(250, "di2", OLD, 500);
    expect(h.percent).toBe(50);
    expect(h.status).toBe("healthy");
  });

  it("warns at 80% consumed (20% remaining)", () => {
    const h = getBatteryHealth(400, "di2", OLD, 500);
    expect(h.percent).toBe(20);
    expect(h.status).toBe("warning");
    expect(h.remainingKm).toBe(100);
  });

  it("critical at/over the full range, percent clamped to 0", () => {
    const h = getBatteryHealth(520, "di2", OLD, 500);
    expect(h.status).toBe("critical");
    expect(h.percent).toBe(0);
    expect(h.remainingKm).toBe(-20);
  });

  it("unknown usage (never charged) → full battery, no remaining figure", () => {
    const h = getBatteryHealth(null, "di2", OLD, 500);
    expect(h.percent).toBe(100);
    expect(h.remainingKm).toBeNull();
    expect(h.status).toBe("healthy");
  });
});
