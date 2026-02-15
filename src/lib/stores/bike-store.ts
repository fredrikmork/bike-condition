import { create } from "zustand";

interface BikeStore {
  selectedBikeId: string | null;
  setSelectedBikeId: (id: string) => void;
}

export const useBikeStore = create<BikeStore>((set) => ({
  selectedBikeId: null,
  setSelectedBikeId: (id) => set({ selectedBikeId: id }),
}));
