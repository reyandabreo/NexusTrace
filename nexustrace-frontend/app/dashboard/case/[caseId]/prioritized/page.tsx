"use client";

import { useParams } from "next/navigation";
import { usePrioritized } from "@/hooks/useCases";
import { AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PrioritizedLead } from "@/types/case";

function riskColor(score: number): string {
  if (score >= 0.8) return "text-destructive";
  if (score >= 0.5) return "text-[#f59e0b]";
  return "text-[#22c55e]";
}

function riskBg(score: number): string {
  if (score >= 0.8) return "bg-destructive/20 border-destructive/30";
  if (score >= 0.5) return "bg-[#f59e0b]/20 border-[#f59e0b]/30";
  return "bg-[#22c55e]/20 border-[#22c55e]/30";
}

export default function PrioritizedPage() {
  const params = useParams();
  const caseId = params?.caseId as string;
  const { data: leads, isLoading } = usePrioritized(caseId);

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Check if data is in the expected format
  const leadData: PrioritizedLead[] = Array.isArray(leads) 
    ? leads.filter((item: any) => item.entity && item.entity_type) 
    : [];
  const sorted = [...leadData].sort((a, b) => b.risk_score - a.risk_score);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-[#f59e0b]" />
          Prioritized Leads
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Entities ranked by risk score for investigation priority
        </p>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-20">
          <AlertTriangle className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold text-foreground">
            No prioritized leads
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Process evidence to generate risk-based prioritization
          </p>
        </div>
      ) : (
        <Card className="border-border bg-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Entity</TableHead>
                  <TableHead className="text-muted-foreground">Type</TableHead>
                  <TableHead className="text-muted-foreground">Risk Score</TableHead>
                  <TableHead className="text-muted-foreground">Connections</TableHead>
                  <TableHead className="text-muted-foreground">Reason</TableHead>
                  <TableHead className="text-muted-foreground">Last Seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((lead, idx) => (
                  <TableRow
                    key={lead.id || `${lead.entity}-${lead.entity_type}-${idx}`}
                    className="border-border hover:bg-muted/50"
                  >
                    <TableCell className="font-medium text-foreground">
                      {lead.entity}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-[10px] border-border text-muted-foreground"
                      >
                        {lead.entity_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 rounded-full bg-muted">
                          <div
                            className={`h-2 rounded-full ${
                              lead.risk_score >= 0.8
                                ? "bg-destructive"
                                : lead.risk_score >= 0.5
                                  ? "bg-[#f59e0b]"
                                  : "bg-[#22c55e]"
                            }`}
                            style={{
                              width: `${lead.risk_score * 100}%`,
                            }}
                          />
                        </div>
                        <span
                          className={`text-sm font-semibold ${riskColor(lead.risk_score)}`}
                        >
                          {(lead.risk_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lead.connections}
                    </TableCell>
                    <TableCell className="max-w-50  truncate text-muted-foreground">
                      {lead.reason}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(lead.last_seen).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
