"use client";

import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useCase, useNetworkGraph, useEntities, usePrioritized } from "@/hooks/useCases";
import { useEvidenceList } from "@/hooks/useUpload";
import { useCaseStore } from "@/store/caseStore";
import { useActivityStore } from "@/store/activityStore";
import { getCaseName, formatCaseStatus } from "@/lib/caseUtils";
import EvidenceUpload from "@/components/evidence/EvidenceUpload";
import EvidenceList from "@/components/evidence/EvidenceList";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FolderOpen,
  Clock,
  FileText,
  Users,
  BarChart3,
  Shield,
} from "lucide-react";

const statusColor: Record<string, string> = {
  open: "bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/30",
  in_progress: "bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30",
  closed: "bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30",
};

export default function CaseOverviewPage() {
  const params = useParams();
  const caseId = params?.caseId as string;
  const { data: caseData, isLoading } = useCase(caseId);
  const { data: evidence } = useEvidenceList(caseId);
  const { data: entities } = useEntities(caseId);
  const { data: prioritized } = usePrioritized(caseId);
  const addActivity = useActivityStore((s) => s.addActivity);
  const trackedCaseRef = useRef<string | null>(null);
  
  // Track case view only once per case
  useEffect(() => {
    if (caseData && trackedCaseRef.current !== caseId) {
      trackedCaseRef.current = caseId;
      addActivity({
        type: "view",
        action: `Viewed case: ${getCaseName(caseData)}`,
        target: caseId,
      });
    }
  }, [caseData, caseId, addActivity]);
  
  // Filter prioritized data to get valid leads (exclude chunks)
  const validLeads = prioritized?.filter((item: any) => item.entity && item.entity_type) || [];

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <FolderOpen className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">
            {caseData ? getCaseName(caseData) : "Case Overview"}
          </h1>
          {caseData && (
            <Badge
              variant="outline"
              className={statusColor[caseData.status || "open"] || statusColor.open}
            >
              {formatCaseStatus(caseData.status)}
            </Badge>
          )}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {caseData?.description || "Investigation details and evidence management"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {evidence?.length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Evidence Files</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#22c55e]/10">
              <Users className="h-5 w-5 text-[#22c55e]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {entities?.length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Entities Found</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f59e0b]/10">
              <BarChart3 className="h-5 w-5 text-[#f59e0b]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {validLeads.length}
              </p>
              <p className="text-xs text-muted-foreground">Priority Leads</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#a855f7]/10">
              <Clock className="h-5 w-5 text-[#a855f7]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {caseData?.created_at
                  ? new Date(caseData.created_at).toLocaleDateString()
                  : "--"}
              </p>
              <p className="text-xs text-muted-foreground">Created</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evidence Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Upload Evidence
          </h2>
          <EvidenceUpload caseId={caseId} />
        </div>
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Evidence Files
          </h2>
          <EvidenceList caseId={caseId} />
        </div>
      </div>
    </div>
  );
}
