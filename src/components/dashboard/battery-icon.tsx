import {
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  BatteryWarning,
  type LucideProps,
} from "lucide-react";
import type { BatteryHealth } from "@/lib/wear/battery";

/**
 * Phone-style battery glyph whose fill reflects the remaining charge.
 * Colour is inherited from the surrounding text (currentColor), so the parent
 * chip drives healthy/warning/critical colouring.
 */
export function BatteryIcon({ health, ...props }: { health: BatteryHealth } & LucideProps) {
  if (health.status === "critical") return <BatteryWarning {...props} />;
  if (health.status === "warning") return <BatteryLow {...props} />;
  if (health.percent > 60) return <BatteryFull {...props} />;
  return <BatteryMedium {...props} />;
}
