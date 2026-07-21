import { create } from "zustand";

/** Just enough of a bike to render a picker — filled by the dashboard. */
export interface BikeOption {
  id: string;
  name: string;
}

interface BikeStore {
  selectedBikeId: string | null;
  setSelectedBikeId: (id: string) => void;
  focusedComponentId: string | null;
  setFocusedComponentId: (id: string | null) => void;
  /**
   * Mountable bikes, shared so deeply nested cards can offer a "move to bike"
   * picker without threading the list through every intermediate component.
   */
  bikes: BikeOption[];
  setBikes: (bikes: BikeOption[]) => void;
  partsBankOpen: boolean;
  setPartsBankOpen: (open: boolean) => void;
}

export const useBikeStore = create<BikeStore>((set) => ({
  selectedBikeId: null,
  setSelectedBikeId: (id) => set({ selectedBikeId: id }),
  focusedComponentId: null,
  setFocusedComponentId: (id) => set({ focusedComponentId: id }),
  bikes: [],
  setBikes: (bikes) => set({ bikes }),
  partsBankOpen: false,
  setPartsBankOpen: (partsBankOpen) => set({ partsBankOpen }),
}));
