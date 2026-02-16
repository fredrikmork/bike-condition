import type { LucideIcon } from "lucide-react";
import {
  Link,
  Disc3,
  CircleDot,
  Hand,
  Disc,
  Cable,
  Hexagon,
  Cog,
  Wrench,
  Gauge,
  Lightbulb,
  Shield,
  Zap,
  Layers,
  Grip,
  Box,
  Ruler,
  Timer,
  CircleDashed,
  Bolt,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  chain: Link,
  cassette: Disc3,
  tire_front: CircleDot,
  tire_rear: CircleDot,
  brake_pads_front: Hand,
  brake_pads_rear: Hand,
  brake_rotors: Disc,
  cables: Cable,
  bottom_bracket: Hexagon,
  chainrings: Cog,
};

/**
 * Get the icon component for a component type or custom icon key.
 * Custom components store an icon key; default components derive from type.
 */
export function getComponentIcon(type: string, iconKey?: string | null): LucideIcon {
  if (iconKey) {
    return CUSTOM_ICON_MAP[iconKey] ?? Wrench;
  }
  return ICON_MAP[type] ?? Wrench;
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
