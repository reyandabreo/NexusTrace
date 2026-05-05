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
    set({ currentCaseId: caseData.case_id || caseData.id || null, selectedCase: caseData }),
  clearCase: () => set({ currentCaseId: null, selectedCase: null }),
}));
