import type { BikeConfig } from "@/lib/supabase/types";

/**
 * Returns true if a component type should be visible given the bike's configuration.
 * When config is null (bike not yet configured), all components are shown.
 */
export function isComponentVisible(
  type: string,
  config: BikeConfig | null
): boolean {
  if (!config) return true;

  // Electronic shifting → no cables
  if (config.shifting_type === "electronic") {
    if (type === "shift_cables" || type === "cables") return false;
  }

  // Disc brakes → no brake cables (hydraulic), no rim-specific types
  if (config.brake_type === "disc") {
    if (type === "brake_cables") return false;
  }

  // Rim brakes → no rotors, no disc-specific types
  if (config.brake_type === "rim") {
    if (
      type === "brake_rotor_front" ||
      type === "brake_rotor_rear" ||
      type === "brake_rotors" // legacy
    ) return false;
  }

  // Tubeless → no inner tubes
  if (config.tire_system === "tubeless") {
    if (type === "inner_tube_front" || type === "inner_tube_rear") return false;
  }

  return true;
}

/** Extract a BikeConfig from a Bike row — returns null if config is incomplete */
export function getBikeConfig(bike: {
  shifting_type: string | null;
  brake_type: string | null;
  drivetrain_speed: number | null;
  tire_system: string | null;
  config_complete: boolean;
}): BikeConfig | null {
  if (
    !bike.config_complete ||
    !bike.shifting_type ||
    !bike.brake_type ||
    !bike.drivetrain_speed ||
    !bike.tire_system
  ) {
    return null;
  }

  return {
    shifting_type: bike.shifting_type as BikeConfig["shifting_type"],
    brake_type: bike.brake_type as BikeConfig["brake_type"],
    drivetrain_speed: bike.drivetrain_speed,
    tire_system: bike.tire_system as BikeConfig["tire_system"],
  };
}
