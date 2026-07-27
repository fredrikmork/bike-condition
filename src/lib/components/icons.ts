import type { LucideIcon } from "lucide-react";
import {
  Bike,
  Bolt,
  Box,
  Cable,
  CircleDashed,
  CircleDot,
  Cog,
  Disc,
  Disc3,
  Gauge,
  Grip,
  Hand,
  Hexagon,
  Layers,
  Lightbulb,
  Link,
  Ruler,
  Shield,
  Timer,
  Wrench,
  Zap,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import {
  EBikeIcon,
  HybridBikeIcon,
  MtbBikeIcon,
  RoadBikeIcon,
  TtBikeIcon,
} from "@/components/icons/bike-icons";
import {
  BarTapeIcon,
  BottomBracketIcon,
  BrakePadsIcon,
  BrakeRotorIcon,
  CableIcon,
  CassetteIcon,
  ChainIcon,
  ChainringIcon,
  CleatIcon,
  DrivetrainIcon,
  InnerTubeIcon,
  PulleyWheelsIcon,
  SpokedWheelIcon,
  TireIcon,
} from "@/components/icons/component-icons";

/** Anything renderable as `<Icon className=... />` — lucide or our own SVGs. */
export type AnyIcon = ComponentType<SVGProps<SVGSVGElement>>;

/**
 * The part-shaped icons (Trello #14): a chain that looks like a chain, a
 * cassette that looks like a cassette. Containers get their assembly icons.
 */
const ICON_MAP: Record<string, AnyIcon> = {
  // Containers
  wheel_front: SpokedWheelIcon,
  wheel_rear: SpokedWheelIcon,
  drivetrain: DrivetrainIcon,
  // Drivetrain
  chain: ChainIcon,
  cassette: CassetteIcon,
  chainrings: ChainringIcon,
  bottom_bracket: BottomBracketIcon,
  pulley_wheels: PulleyWheelsIcon,
  // Wheels
  tire_front: TireIcon,
  tire_rear: TireIcon,
  inner_tube_front: InnerTubeIcon,
  inner_tube_rear: InnerTubeIcon,
  // Brakes
  brake_pads_front: BrakePadsIcon,
  brake_pads_rear: BrakePadsIcon,
  brake_rotor_front: BrakeRotorIcon,
  brake_rotor_rear: BrakeRotorIcon,
  // Cables
  shifter_cables: CableIcon,
  brake_cables: CableIcon,
  // Contact points
  bar_tape: BarTapeIcon,
  cleats: CleatIcon,
  // Legacy
  brake_rotors: BrakeRotorIcon,
  cables: CableIcon,
};

/**
 * Get the icon component for a component type or custom icon key.
 * Custom components store an icon key; default components derive from type.
 */
export function getComponentIcon(type: string, iconKey?: string | null): AnyIcon {
  if (iconKey) {
    return CUSTOM_ICON_MAP[iconKey] ?? Wrench;
  }
  return ICON_MAP[type] ?? Wrench;
}

/**
 * Bike silhouette per bike type: drop bars for road, flat bar for MTB, aero
 * extensions for TT. Falls back to Strava's frame_type when the user has not
 * configured a type, and to the generic lucide bike when neither is known.
 */
export function getBikeTypeIcon(
  bikeType: string | null,
  frameType: number | null | undefined
): AnyIcon {
  switch (bikeType) {
    case "road":
      return RoadBikeIcon;
    case "mtb":
      return MtbBikeIcon;
    case "tt":
      return TtBikeIcon;
    case "hybrid":
      return HybridBikeIcon;
    case "ebike":
      return EBikeIcon;
  }
  // Strava frame_type: 1 = MTB, 2 = Cross, 3 = Road, 4 = Time Trial
  switch (frameType) {
    case 1:
      return MtbBikeIcon;
    case 2:
      return HybridBikeIcon;
    case 3:
      return RoadBikeIcon;
    case 4:
      return TtBikeIcon;
  }
  return Bike;
}

/** Curated icons available for custom components */
export const CUSTOM_ICON_OPTIONS = [
  { key: "wrench", label: "Wrench", icon: Wrench },
  { key: "cog", label: "Cog", icon: Cog },
  { key: "link", label: "Link", icon: Link },
  { key: "disc", label: "Disc", icon: Disc },
  { key: "disc3", label: "Disc3", icon: Disc3 },
  { key: "circle-dot", label: "CircleDot", icon: CircleDot },
  { key: "hexagon", label: "Hexagon", icon: Hexagon },
  { key: "hand", label: "Hand", icon: Hand },
  { key: "cable", label: "Cable", icon: Cable },
  { key: "gauge", label: "Gauge", icon: Gauge },
  { key: "lightbulb", label: "Lightbulb", icon: Lightbulb },
  { key: "shield", label: "Shield", icon: Shield },
  { key: "zap", label: "Zap", icon: Zap },
  { key: "layers", label: "Layers", icon: Layers },
  { key: "grip", label: "Grip", icon: Grip },
  { key: "box", label: "Box", icon: Box },
  { key: "ruler", label: "Ruler", icon: Ruler },
  { key: "timer", label: "Timer", icon: Timer },
  { key: "circle-dashed", label: "CircleDashed", icon: CircleDashed },
  { key: "bolt", label: "Bolt", icon: Bolt },
] as const;

const CUSTOM_ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  CUSTOM_ICON_OPTIONS.map((o) => [o.key, o.icon])
);
