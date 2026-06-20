type BatteryStatus = "healthy" | "warning" | "critical";

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

/**
 * km per charge. A user-set range (km) takes precedence; otherwise it is
 * estimated from the drivetrain system and adjusted for battery age (using the
 * bike creation date as a proxy).
 */
function getEffectiveChargeRange(
  system: string | null,
  bikeCreatedAt: string,
  userRangeKm?: number | null
): number {
  if (userRangeKm != null && userRangeKm > 0) {
    return Math.round(userRangeKm);
  }

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
  effectiveRange: number; // km per charge (user-set or age-adjusted estimate)
  remainingKm: number | null; // km until charge recommended (negative = overdue)
  percent: number; // remaining charge, 0–100 (for the battery icon fill)
}

export function getBatteryHealth(
  kmSinceCharge: number | null,
  system: string | null,
  bikeCreatedAt: string,
  userRangeKm?: number | null
): BatteryHealth {
  const effectiveRange = getEffectiveChargeRange(system, bikeCreatedAt, userRangeKm);
  const warningAt = Math.round(effectiveRange * WARNING_FRACTION);

  // Unknown usage (never charged / no data) — treat as full.
  if (kmSinceCharge === null) {
    return { status: "healthy", effectiveRange, remainingKm: null, percent: 100 };
  }

  const remainingKm = effectiveRange - kmSinceCharge;
  const percent = Math.max(0, Math.min(100, Math.round((remainingKm / effectiveRange) * 100)));

  if (kmSinceCharge >= effectiveRange) {
    return { status: "critical", effectiveRange, remainingKm, percent };
  }
  if (kmSinceCharge >= warningAt) {
    return { status: "warning", effectiveRange, remainingKm, percent };
  }
  return { status: "healthy", effectiveRange, remainingKm, percent };
}
