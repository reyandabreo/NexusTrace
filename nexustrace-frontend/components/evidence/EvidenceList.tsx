"use client";

import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEvidenceList } from "@/hooks/useUpload";
import type { Evidence } from "@/types/case";

export default function EvidenceList({ caseId }: { caseId: string }) {
  const { data: evidence, isLoading, error } = useEvidenceList(caseId);

  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="space-y-3 p-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="flex flex-col items-center justify-center p-10 text-center">
          <FileText className="mb-3 h-10 w-10 text-destructive/40" />
          <p className="text-sm text-destructive">
            Error loading evidence
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Please ensure you are logged in
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!evidence || evidence.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="flex flex-col items-center justify-center p-10 text-center">
          <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No evidence uploaded yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4">
        {/* Header */}
        <div className="mb-3 grid grid-cols-3 gap-4 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          <span>File Name</span>
          <span>File Type</span>
          <span>Added</span>
        </div>
        {/* Rows */}
        <div className="space-y-1">
          {evidence.map((e) => (
            <div
              key={e.evidence_id}
              className="grid grid-cols-3 items-center gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-muted"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="truncate text-sm font-medium text-foreground">
                  {e.filename}
                </span>
              </div>
              <div>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-primary/20 text-primary border-primary/30"
                >
                  {e.file_type.toUpperCase()}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {e.created_at ? new Date(e.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
