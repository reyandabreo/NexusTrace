import { create } from "zustand";
import type { Case } from "@/types/case";

interface CaseState {
  currentCaseId: string | null;
  selectedCase: Case | null;
  setCurrentCase: (caseData: Case) => void;
  clearCase: () => void;
}

export const useCaseStore = create<CaseState>()((set) => ({
  currentCaseId: null,
  selectedCase: null,
  setCurrentCase: (caseData) =>
    set({ currentCaseId: caseData.id, selectedCase: caseData }),
  clearCase: () => set({ currentCaseId: null, selectedCase: null }),
}));
