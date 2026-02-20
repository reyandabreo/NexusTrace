"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  FolderOpen,
  Clock,
  FileText,
  Search,
  AlertTriangle,
  Brain,
  TrendingUp,
  ArrowRight,
  Zap,
  Upload,
  BarChart3,
} from "lucide-react";
import { useCases, useCreateCase, useNetworkGraph, usePrioritized } from "@/hooks/useCases";
import { useQueries } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useCaseStore } from "@/store/caseStore";
import { getCaseId, getCaseName, formatCaseStatus } from "@/lib/caseUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Case } from "@/types/case";

const statusColor: Record<string, string> = {
  open: "bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/30",
  in_progress: "bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30",
  closed: "bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30",
};

const statCards = [
  {
    label: "Active Cases",
    icon: FolderOpen,
    color: "text-primary",
    bg: "bg-primary/10",
    key: "active",
  },
  {
    label: "Total Evidence",
    icon: FileText,
    color: "text-[#22c55e]",
    bg: "bg-[#22c55e]/10",
    key: "evidence",
  },
  {
    label: "High-Risk Alerts",
    icon: AlertTriangle,
    color: "text-[#f59e0b]",
    bg: "bg-[#f59e0b]/10",
    key: "alerts",
  },
  {
    label: "AI Queries",
    icon: Brain,
    color: "text-[#a855f7]",
    bg: "bg-[#a855f7]/10",
    key: "queries",
  },
];

export default function DashboardPage() {
  const { data: cases, isLoading } = useCases();
  const createCase = useCreateCase();
  const user = useAuthStore((s) => s.user);
  const setCurrentCase = useCaseStore((s) => s.setCurrentCase);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Fetch network graphs for all cases to count total evidence
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

  // Count total evidence from all network graphs
  const totalEvidence = useMemo(() => {
    return networkQueries.reduce((acc, query) => {
      if (query.data?.nodes) {
        const evidenceCount = query.data.nodes.filter(
          (node: any) => node.type === "Evidence"
        ).length;
        return acc + evidenceCount;
      }
      return acc;
    }, 0);
  }, [networkQueries]);

  // Count high-risk alerts (risk_score >= 0.7)
  const highRiskAlerts = useMemo(() => {
    return prioritizedQueries.reduce((acc, query) => {
      if (Array.isArray(query.data)) {
        const highRiskCount = query.data.filter(
          (lead: any) => lead.risk_score >= 0.7
        ).length;
        return acc + highRiskCount;
      }
      return acc;
    }, 0);
  }, [prioritizedQueries]);

  const filteredCases = cases?.filter(
    (c) =>
      getCaseName(c).toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createCase.mutate(
      { name: title, description },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setTitle("");
          setDescription("");
        },
      }
    );
  };

  // Compute stats from cases data
  const activeCases = cases?.filter((c) => (c.status || "open") !== "closed").length || 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Welcome Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-2 w-2 rounded-full bg-[#22c55e] animate-pulse" />
          <span className="text-xs font-medium text-[#22c55e]">System Online</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          Welcome back, {user?.username || "Investigator"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s your forensic intelligence overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-6 sm:mb-8 grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          let value: string | number = "--";
          if (stat.key === "active") value = activeCases;
          else if (stat.key === "evidence") value = totalEvidence;
          else if (stat.key === "alerts") value = highRiskAlerts;
          else if (stat.key === "queries") value = "--";

          return (
            <Card key={stat.key} className="border-border bg-card">
              <CardContent className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5">
                <div
                  className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl ${stat.bg}`}
                >
                  <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{value}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mb-6 sm:mb-8">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Quick Actions</h2>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 border-border bg-muted/30 hover:bg-muted text-xs sm:text-sm">
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">New Case</span>
                <span className="sm:hidden">New</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="border-border bg-card">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  Create New Investigation
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Start a new forensic investigation case
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Case Title</Label>
                  <Input
                    placeholder="e.g., Financial Fraud Investigation Q3"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="border-border bg-muted text-foreground"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Description</Label>
                  <Textarea
                    placeholder="Brief description of the investigation..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="border-border bg-muted text-foreground"
                    rows={3}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full rounded-xl"
                  disabled={createCase.isPending}
                >
                  {createCase.isPending ? "Creating..." : "Create Case"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          <Link href="/dashboard/analytics">
            <Button variant="outline" className="gap-2 border-border bg-muted/30 hover:bg-muted text-xs sm:text-sm">
              <BarChart3 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">View Analytics</span>
              <span className="sm:hidden">Analytics</span>
            </Button>
          </Link>
          <Link href="/dashboard/activity">
            <Button variant="outline" className="gap-2 border-border bg-muted/30 hover:bg-muted text-xs sm:text-sm">
              <Clock className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Activity Log</span>
              <span className="sm:hidden">Activity</span>
            </Button>
          </Link>
        </div>
      </div>

      <Separator className="mb-6 sm:mb-8 bg-border" />

      {/* Cases Section */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-foreground">
            Investigation Cases
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {cases?.length || 0} total &middot; {activeCases} active
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter cases..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 border-border bg-muted/50 pl-9 text-sm text-foreground"
          />
        </div>
      </div>

      {/* Cases Grid */}
      {isLoading ? (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-border bg-card">
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="mt-2 h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCases && filteredCases.length > 0 ? (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredCases.map((c: Case) => (
            <Link
              key={getCaseId(c)}
              href={`/dashboard/case/${getCaseId(c)}`}
              onClick={() => setCurrentCase(c)}
            >
              <Card className="group cursor-pointer border-border bg-card transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-primary" />
                      <CardTitle className="text-sm font-semibold text-foreground">
                        {getCaseName(c)}
                      </CardTitle>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${statusColor[c.status || "open"] || statusColor.open}`}
                    >
                      {formatCaseStatus(c.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="line-clamp-2 text-sm text-muted-foreground">
                    {c.description}
                  </CardDescription>
                  <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                    {c.evidence_count !== undefined && (
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {c.evidence_count} files
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-20">
          <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold text-foreground">
            No cases yet
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first investigation to get started
          </p>
          <Button
            className="mt-6 gap-2 rounded-xl"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            New Case
          </Button>
        </div>
      )}
    </div>
  );
}
