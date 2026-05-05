"use client";

import { useParams } from "next/navigation";
import { usePrioritized } from "@/hooks/useCases";
import { AlertTriangle, Lightbulb, Radar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatCompactDate } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import type { PrioritizedLead } from "@/types/case";

function riskColor(score: number): string {
  if (score >= 0.8) return "text-destructive";
  if (score >= 0.5) return "text-[#f59e0b]";
  return "text-[#22c55e]";
}

function formatTypeLabel(type: string): string {
  if (!type) return "other";
  return type.replace(/_/g, " ");
}

function compactDriver(driver: string): string {
  if (!driver) return "";
  return driver
    .replace(/\s+contributes\s+[0-9]*\.?[0-9]+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function safeLastSeen(value: string): string {
  if (!value || value === "N/A" || value === "Unknown") return "N/A";
  return formatCompactDate(value);
}

function isPrioritizedLead(value: unknown): value is PrioritizedLead {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PrioritizedLead>;
  return Boolean(candidate.entity && candidate.entity_type);
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
    ? leads.filter(isPrioritizedLead)
    : [];
  const sorted = [...leadData].sort((a, b) => b.risk_score - a.risk_score);
  const highRiskCount = sorted.filter((lead) => lead.risk_score >= 0.8).length;
  const mediumRiskCount = sorted.filter((lead) => lead.risk_score >= 0.5 && lead.risk_score < 0.8).length;
  const lowRiskCount = sorted.filter((lead) => lead.risk_score < 0.5).length;

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

      {sorted.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
            High Risk: {highRiskCount}
          </Badge>
          <Badge variant="outline" className="border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#f59e0b]">
            Medium Risk: {mediumRiskCount}
          </Badge>
          <Badge variant="outline" className="border-[#22c55e]/30 bg-[#22c55e]/10 text-[#22c55e]">
            Low Risk: {lowRiskCount}
          </Badge>
        </div>
      )}

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
            <div className="overflow-x-auto">
              <Table className="w-full table-fixed">
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="w-[18%] text-muted-foreground">Entity</TableHead>
                    <TableHead className="w-[10%] text-muted-foreground">Type</TableHead>
                    <TableHead className="w-[14%] text-muted-foreground">Risk Score</TableHead>
                    <TableHead className="w-[10%] text-muted-foreground">Connections</TableHead>
                    <TableHead className="w-[38%] text-muted-foreground">Why / Counterfactual</TableHead>
                    <TableHead className="w-[10%] text-right text-muted-foreground">Last Seen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((lead, idx) => (
                    <TableRow
                      key={lead.id || `${lead.entity}-${lead.entity_type}-${idx}`}
                      className="border-border align-top hover:bg-muted/40"
                    >
                      <TableCell className="w-[18%] align-top font-medium text-foreground">
                        <div className="break-words whitespace-normal">{lead.entity}</div>
                      </TableCell>
                      <TableCell className="w-[10%] align-top">
                        <Badge
                          variant="outline"
                          className="text-[10px] border-border text-muted-foreground"
                        >
                          {formatTypeLabel(lead.entity_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-[14%] align-top">
                        <div className="flex items-center gap-2 pt-0.5">
                          <div className="h-2 w-18 rounded-full bg-muted">
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
                          <span className={`text-sm font-semibold ${riskColor(lead.risk_score)}`}>
                            {(lead.risk_score * 100).toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="w-[10%] align-top text-muted-foreground">
                        {lead.connections}
                      </TableCell>
                      <TableCell className="w-[38%] align-top overflow-hidden">
                        <div className="space-y-2 py-0.5">
                          <p className="text-sm leading-relaxed text-foreground break-words whitespace-normal">
                            {lead.reason}
                          </p>

                          {lead.top_risk_drivers && lead.top_risk_drivers.length > 0 && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                <Radar className="h-3.5 w-3.5" />
                                Drivers
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {lead.top_risk_drivers.slice(0, 3).map((driver, driverIndex) => (
                                  <Badge
                                    key={`${lead.id}-driver-${driverIndex}`}
                                    variant="outline"
                                    className="border-border bg-muted/30 text-[10px] text-muted-foreground"
                                  >
                                    {compactDriver(driver)}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {lead.counterfactual_explanations && lead.counterfactual_explanations.length > 0 && (
                            <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
                              <div className="mb-1 flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-primary/80">
                                <Lightbulb className="h-3.5 w-3.5" />
                                What-if
                              </div>
                              <p className="text-xs leading-relaxed text-primary break-words whitespace-normal">
                                {lead.counterfactual_explanations[0]}
                              </p>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="w-[10%] align-top whitespace-nowrap text-right text-muted-foreground">
                        {safeLastSeen(lead.last_seen)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
