"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useCase } from "@/hooks/useCases";
import { useCaseStore } from "@/store/caseStore";
import CaseSidebar from "@/components/layout/CaseSidebar";

export default function CaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const caseId = params?.caseId as string;
  const { data: caseData } = useCase(caseId);
  const setCurrentCase = useCaseStore((s) => s.setCurrentCase);

  useEffect(() => {
    if (caseData) {
      setCurrentCase(caseData);
    }
  }, [caseData, setCurrentCase]);

  return (
    <div className="flex h-full overflow-hidden">
      <CaseSidebar />
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
