export type BatteryStatus = "healthy" | "warning" | "critical";

interface BatterySystemDef {
  baseChargeKm: number; // km per charge for a new battery
}

const BATTERY_SYSTEMS: Record<string, BatterySystemDef> = {
  di2: { baseChargeKm: 1000 }, // Shimano Di2 — typically 1 000–2 000 km
  axs: { baseChargeKm: 700 }, // SRAM AXS — ~60 h shifting ≈ 700 km
  eps: { baseChargeKm: 500 }, // Campagnolo EPS — more frequent charging needed
  other: { baseChargeKm: 700 },
};

const DEFAULT_BASE_KM = 700;
const DEGRADATION_PER_YEAR = 0.03; // Li-ion loses ~3 % capacity per year
const MIN_CAPACITY_FACTOR = 0.5; // Never drop below 50 % of rated range
const WARNING_FRACTION = 0.8; // Warn at 80 % of effective range

/** km per charge, adjusted for battery age (using bike creation date as proxy) */
export function getEffectiveChargeRange(system: string | null, bikeCreatedAt: string): number {
  const base = system
    ? (BATTERY_SYSTEMS[system]?.baseChargeKm ?? DEFAULT_BASE_KM)
    : DEFAULT_BASE_KM;

  const ageYears =
    (Date.now() - new Date(bikeCreatedAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000);

  const factor = Math.max(MIN_CAPACITY_FACTOR, 1 - DEGRADATION_PER_YEAR * ageYears);
  return Math.round(base * factor);
}

export interface BatteryHealth {
  status: BatteryStatus;
  effectiveRange: number; // age-adjusted km per charge
  remainingKm: number | null; // km until charge recommended (negative = overdue)
}

export function getBatteryHealth(
  kmSinceCharge: number | null,
  system: string | null,
  bikeCreatedAt: string
): BatteryHealth {
  const effectiveRange = getEffectiveChargeRange(system, bikeCreatedAt);
  const warningAt = Math.round(effectiveRange * WARNING_FRACTION);

  if (kmSinceCharge === null) {
    return { status: "healthy", effectiveRange, remainingKm: null };
  }

  const remainingKm = effectiveRange - kmSinceCharge;

  if (kmSinceCharge >= effectiveRange) {
    return { status: "critical", effectiveRange, remainingKm };
  }
  if (kmSinceCharge >= warningAt) {
    return { status: "warning", effectiveRange, remainingKm };
  }
  return { status: "healthy", effectiveRange, remainingKm };
}
