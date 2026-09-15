import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { InvestigationSetup } from "@/types/investigation";

type InvestigationState = {
  setup: InvestigationSetup | null;
  commitSetup: (setup: InvestigationSetup) => void;
  clearSetup: () => void;
};

export const useInvestigationStore = create<InvestigationState>()(
  persist(
    (set) => ({
      setup: null,
      commitSetup: (setup) => set({ setup }),
      clearSetup: () => set({ setup: null }),
    }),
    { name: "cercacia-investigation-setup" }
  )
);
