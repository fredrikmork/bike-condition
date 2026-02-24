import { create } from "zustand";

interface BikeStore {
  selectedBikeId: string | null;
  setSelectedBikeId: (id: string) => void;
  focusedComponentId: string | null;
  setFocusedComponentId: (id: string | null) => void;
}

export const useBikeStore = create<BikeStore>((set) => ({
  selectedBikeId: null,
  setSelectedBikeId: (id) => set({ selectedBikeId: id }),
  focusedComponentId: null,
  setFocusedComponentId: (id) => set({ focusedComponentId: id }),
}));
