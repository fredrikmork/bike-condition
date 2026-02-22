import { create } from "zustand";

interface HoverStore {
  hoveredType: string | null;
  setHoveredType: (type: string | null) => void;
}

export const useHoverStore = create<HoverStore>((set) => ({
  hoveredType: null,
  setHoveredType: (type) => set({ hoveredType: type }),
}));
