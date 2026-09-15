import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  InvestigationResult,
  InvestigationSetup,
} from "@/types/investigation";

type InvestigationState = {
  setup: InvestigationSetup | null;
  result: InvestigationResult | null;
  commitSetup: (setup: InvestigationSetup) => void;
  clearSetup: () => void;
  setResult: (result: InvestigationResult) => void;
  clearResult: () => void;
};

export const useInvestigationStore = create<InvestigationState>()(
  persist(
    (set) => ({
      setup: null,
      result: null,
      commitSetup: (setup) => set({ setup, result: null }),
      clearSetup: () => set({ setup: null }),
      setResult: (result) => set({ result }),
      clearResult: () => set({ result: null }),
    }),
    { name: "cercacia-investigation-setup" }
  )
);
