"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCase, useNetworkGraph, useEntities, usePrioritized, useUpdateCase } from "@/hooks/useCases";
import { useEvidenceList } from "@/hooks/useUpload";
import { useQueryHistory } from "@/hooks/useRag";
import { useCaseStore } from "@/store/caseStore";
import { useActivityStore } from "@/store/activityStore";
import { useAuthStore } from "@/store/authStore";
import { getCaseName, formatCaseStatus } from "@/lib/caseUtils";
import { formatCompactDate } from "@/lib/utils";
import { toast } from "sonner";
import EvidenceUpload from "@/components/evidence/EvidenceUpload";
import EvidenceList from "@/components/evidence/EvidenceList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  FolderOpen,
  Clock,
  FileText,
  Users,
  BarChart3,
  Shield,
  CheckCircle,
  MessageSquare,
  ChevronRight,
  RotateCcw,
} from "lucide-react";

const statusColor: Record<string, string> = {
  open: "bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/30",
  in_progress: "bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30",
  closed: "bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30",
};

export default function CaseOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params?.caseId as string;
  const { data: caseData, isLoading } = useCase(caseId);
  const { data: evidence } = useEvidenceList(caseId);
  const { data: entities } = useEntities(caseId);
  const { data: prioritized } = usePrioritized(caseId);
  const { data: queryHistory } = useQueryHistory(caseId);
  const updateCase = useUpdateCase();
  const addActivity = useActivityStore((s) => s.addActivity);
  const user = useAuthStore((s) => s.user);
  const trackedCaseRef = useRef<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isReopening, setIsReopening] = useState(false);
  
  // Track case view only once per case
  useEffect(() => {
    if (caseData && trackedCaseRef.current !== caseId && user) {
      trackedCaseRef.current = caseId;
      addActivity({
        type: "view",
        action: `Viewed case: ${getCaseName(caseData)}`,
        target: caseId,
        userId: user.id,
      });
    }
  }, [caseData, caseId, addActivity, user]);
  
  // Filter prioritized data to get valid leads (exclude chunks)
  const validLeads = prioritized?.filter((item: any) => item.entity && item.entity_type) || [];

  const handleCloseCase = async () => {
    if (!user) return;
    
    setIsClosing(true);
    try {
      await updateCase.mutateAsync({
        caseId,
        data: { status: "closed" },
      });
      
      toast.success("Case closed", {
        description: `${getCaseName(caseData)} has been marked as closed`,
      });
      
      addActivity({
        type: "update",
        action: `Closed case: ${getCaseName(caseData)}`,
        target: caseId,
        userId: user.id,
      });
    } catch (error) {
      console.error("Failed to close case:", error);
      toast.error("Failed to close case", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsClosing(false);
    }
  };

  const handleReopenCase = async () => {
    if (!user) return;

    setIsReopening(true);
    try {
      await updateCase.mutateAsync({
        caseId,
        data: { status: "open" },
      });

      toast.success("Case reopened", {
        description: `${getCaseName(caseData)} has been reopened`,
      });

      addActivity({
        type: "update",
        action: `Reopened case: ${getCaseName(caseData)}`,
        target: caseId,
        userId: user.id,
      });
    } catch (error) {
      console.error("Failed to reopen case:", error);
      toast.error("Failed to reopen case", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsReopening(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="mb-8 space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-3 flex-wrap">
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
          {caseData && caseData.status !== "closed" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 border-[#22c55e]/30 text-[#22c55e] hover:bg-[#22c55e]/10"
                  suppressHydrationWarning
                >
                  <CheckCircle className="h-4 w-4" />
                  Close Case
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="border-border bg-card">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-foreground">Close this case?</AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground">
                    This will mark the case as closed. You can still view the case and its evidence,
                    but it will be moved to the closed cases section.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCloseCase}
                    disabled={isClosing}
                    className="bg-[#22c55e] hover:bg-[#22c55e]/90"
                  >
                    {isClosing ? "Closing..." : "Close Case"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {caseData && caseData.status === "closed" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
                  suppressHydrationWarning
                >
                  <RotateCcw className="h-4 w-4" />
                  Reopen Case
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="border-border bg-card">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-foreground">Reopen this case?</AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground">
                    This will mark the case as active again and return it to the ongoing investigations list.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleReopenCase}
                    disabled={isReopening}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isReopening ? "Reopening..." : "Reopen Case"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
            <div className="min-w-0 flex-1">
              <p className="text-2xl font-bold text-foreground truncate">
                {caseData?.created_at
                  ? formatCompactDate(caseData.created_at)
                  : "--"}
              </p>
              <p className="text-xs text-muted-foreground">Created</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evidence Section */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
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

      {/* AI Assistant Section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            AI Assistant Query History
          </h2>
        </div>
        
        {queryHistory && queryHistory.length > 0 ? (
          <div className="space-y-3">
            {queryHistory.map((query: any) => (
              <Card key={query.query_id} className="border-border bg-card hover:bg-accent/5 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="font-medium text-foreground text-sm">
                          {query.question}
                        </p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap" suppressHydrationWarning>
                          {new Date(query.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {query.answer && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {query.answer}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {query.chunks_retrieved || 0} chunks retrieved
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-primary hover:text-primary"
                          onClick={() => router.push(`/dashboard/case/${caseId}/rag?queryId=${query.query_id}`)}
                        >
                          View in RAG
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-border bg-card">
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-1">
                No queries yet
              </p>
              <p className="text-xs text-muted-foreground/70 mb-4">
                Start asking questions to the AI assistant in the RAG section
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/dashboard/case/${caseId}/rag`)}
                className="gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Go to RAG Assistant
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
