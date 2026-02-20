"use client";

import { useMemo } from "react";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Brain,
  FileText,
  Users,
  AlertTriangle,
  Activity,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCases } from "@/hooks/useCases";
import { useQueryHistory } from "@/hooks/useRag";
import { useQueries } from "@tanstack/react-query";
import api from "@/lib/api";
import { getCaseId } from "@/lib/caseUtils";

// Bar component for simple charts
function BarItem({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { data: cases } = useCases();
  const { data: allQueries } = useQueryHistory();

  const totalCases = cases?.length || 0;
  const openCases = cases?.filter((c) => (c.status || "open") === "open").length || 0;
  const inProgressCases = cases?.filter((c) => (c.status || "open") === "in_progress").length || 0;
  const closedCases = cases?.filter((c) => (c.status || "open") === "closed").length || 0;
  const totalQueries = allQueries?.length || 0;

  // Fetch network graphs for all cases
  const caseIds = cases?.map((c) => getCaseId(c)).filter(Boolean) || [];
  const networkQueries = useQueries({
    queries: caseIds.map((id) => ({
      queryKey: ["network", id],
      queryFn: async () => {
        const res = await api.get(`/graph/network/${id}`);
        return res.data;
      },
      enabled: !!id,
    })),
  });

  // Fetch prioritized leads for all cases
  const prioritizedQueries = useQueries({
    queries: caseIds.map((id) => ({
      queryKey: ["prioritized", id],
      queryFn: async () => {
        const res = await api.get(`/graph/prioritized/${id}`);
        return res.data;
      },
      enabled: !!id,
    })),
  });

  // Count total evidence and entities from all network graphs
  const { totalEvidence, totalEntities, entityTypeCount } = useMemo(() => {
    let evidence = 0;
    let entities = 0;
    const typeCounts: Record<string, number> = {
      PERSON: 0,
      ORG: 0,
      GPE: 0,
      DATE: 0,
      EMAIL: 0,
    };

    networkQueries.forEach((query) => {
      if (query.data?.nodes) {
        query.data.nodes.forEach((node: any) => {
          if (node.type === "Evidence") {
            evidence++;
          } else if (node.type === "Entity") {
            entities++;
            const entityType = node.properties?.type;
            if (entityType && typeCounts[entityType] !== undefined) {
              typeCounts[entityType]++;
            }
          }
        });
      }
    });

    return { totalEvidence: evidence, totalEntities: entities, entityTypeCount: typeCounts };
  }, [networkQueries]);

  // Calculate risk distribution from prioritized leads
  const riskDistribution = useMemo(() => {
    const distribution = {
      critical: 0, // >= 0.9
      high: 0,     // 0.7-0.89
      medium: 0,   // 0.4-0.69
      low: 0,      // < 0.4
    };

    prioritizedQueries.forEach((query) => {
      if (Array.isArray(query.data)) {
        query.data.forEach((lead: any) => {
          const score = lead.risk_score || 0;
          if (score >= 0.9) distribution.critical++;
          else if (score >= 0.7) distribution.high++;
          else if (score >= 0.4) distribution.medium++;
          else distribution.low++;
        });
      }
    });

    return distribution;
  }, [prioritizedQueries]);

  // Status distribution
  const statusDistribution = [
    { label: "Open", value: openCases, color: "bg-[#22c55e]" },
    { label: "In Progress", value: inProgressCases, color: "bg-[#f59e0b]" },
    { label: "Closed", value: closedCases, color: "bg-muted-foreground" },
  ];

  // Entity frequency data
  const entityTypes = [
    { label: "Persons", value: entityTypeCount.PERSON || 0, color: "bg-primary" },
    { label: "Organizations", value: entityTypeCount.ORG || 0, color: "bg-[#22c55e]" },
    { label: "Locations", value: entityTypeCount.GPE || 0, color: "bg-[#f59e0b]" },
    { label: "Emails", value: entityTypeCount.EMAIL || 0, color: "bg-[#a855f7]" },
    { label: "Dates", value: entityTypeCount.DATE || 0, color: "bg-[#ef4444]" },
  ];

  // Risk distribution from prioritized leads
  const riskLevels = [
    { label: "Critical (0.9+)", value: riskDistribution.critical, color: "bg-[#ef4444]" },
    { label: "High (0.7-0.9)", value: riskDistribution.high, color: "bg-[#f59e0b]" },
    { label: "Medium (0.4-0.7)", value: riskDistribution.medium, color: "bg-primary" },
    { label: "Low (<0.4)", value: riskDistribution.low, color: "bg-[#22c55e]" },
  ];

  const maxEntity = Math.max(...entityTypes.map((e) => e.value), 1);
  const maxRisk = Math.max(...riskLevels.map((r) => r.value), 1);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Investigation intelligence metrics and trend analysis
        </p>
      </div>

      {/* Overview Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalCases}</p>
              <p className="text-xs text-muted-foreground">Total Cases</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#22c55e]/10">
              <TrendingUp className="h-5 w-5 text-[#22c55e]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalEvidence}</p>
              <p className="text-xs text-muted-foreground">Evidence Items</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#a855f7]/10">
              <Users className="h-5 w-5 text-[#a855f7]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalEntities}</p>
              <p className="text-xs text-muted-foreground">Entities Tracked</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f59e0b]/10">
              <Brain className="h-5 w-5 text-[#f59e0b]" />
            </div>{totalQueries}
            <div>
              <p className="text-2xl font-bold text-foreground">--</p>
              <p className="text-xs text-muted-foreground">AI Queries Run</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Case Status Distribution */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <PieChart className="h-4 w-4 text-primary" />
              Case Status Distribution
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Breakdown by investigation status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 mb-6">
              {statusDistribution.map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${s.color}`} />
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                  <Badge variant="outline" className="border-border px-1.5 py-0 text-[10px]">
                    {s.value}
                  </Badge>
                </div>
              ))}
            </div>
            {/* Simple horizontal stacked bar */}
            <div className="h-8 w-full overflow-hidden rounded-full bg-muted flex">
              {totalCases > 0 ? (
                statusDistribution.map((s) => (
                  <div
                    key={s.label}
                    className={`h-full ${s.color} transition-all duration-500`}
                    style={{ width: `${(s.value / totalCases) * 100}%` }}
                  />
                ))
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                  No data
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Risk Distribution */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <AlertTriangle className="h-4 w-4 text-[#f59e0b]" />
              Risk Distribution
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Prioritized lead risk scoring breakdown
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {riskLevels.map((r) => (
              <BarItem key={r.label} {...r} max={maxRisk} />
            ))}
          </CardContent>
        </Card>

        {/* Entity Frequency */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Users className="h-4 w-4 text-[#a855f7]" />
              Entity Frequency
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Most common entity types across all cases
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {entityTypes.map((e) => (
              <BarItem key={e.label} {...e} max={maxEntity} />
            ))}
          </CardContent>
        </Card>

        {/* AI Performance */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Brain className="h-4 w-4 text-primary" />
              AI Assistant Stats
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              RAG pipeline performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{totalQueries}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Total Queries</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
                <p className="text-2xl font-bold text-foreground">
                  {totalQueries > 0 
                    ? Math.round((allQueries?.reduce((sum: number, q: any) => sum + (q.chunks_retrieved || 0), 0) || 0) / totalQueries)
                    : 0}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">Avg Chunks Retrieved</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
                <p className="text-2xl font-bold text-foreground">
                  {cases?.filter((c) => {
                    const cid = getCaseId(c);
                    return allQueries?.some((q: any) => q.case_id === cid);
                  }).length || 0}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">Cases with Queries</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
                <p className="text-2xl font-bold text-foreground">
                  {totalQueries > 0 
                    ? `${Math.round((totalQueries / totalCases) * 10) / 10}`
                    : "0"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">Avg Queries/Case</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
