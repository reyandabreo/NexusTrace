"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCase } from "@/hooks/useCases";
import { useCaseStore } from "@/store/caseStore";
import CaseSidebar from "@/components/layout/CaseSidebar";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const caseId = params?.caseId as string;
  const { data: caseData } = useCase(caseId);
  const setCurrentCase = useCaseStore((s) => s.setCurrentCase);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (caseData) {
      setCurrentCase(caseData);
    }
  }, [caseData, setCurrentCase]);

  return (
    <div className="flex h-full overflow-hidden relative">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-16 left-4 z-50 h-9 w-9 lg:hidden bg-background border border-border shadow-lg"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 lg:z-0 transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <CaseSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
