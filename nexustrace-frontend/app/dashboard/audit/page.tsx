"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  Search,
  Filter,
  User,
  Clock,
  Globe,
  FileText,
  LogIn,
  LogOut,
  Upload,
  Trash2,
  Download,
  Calendar,
  Activity,
  AlertCircle,
  CheckCircle2,
  Eye,
  Share2,
  Settings,
  Network,
  Brain,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAuditStore, AuditAction } from "@/store/auditStore";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

const actionIcons: Record<AuditAction, React.ComponentType<any>> = {
  LOGIN: LogIn,
  LOGOUT: LogOut,
  CREATE_CASE: FileText,
  DELETE_CASE: Trash2,
  UPDATE_CASE: FileText,
  UPLOAD_EVIDENCE: Upload,
  DELETE_EVIDENCE: Trash2,
  RAG_QUERY: Brain,
  EXPORT_REPORT: Download,
  VIEW_CASE: Eye,
  SHARE_CASE: Share2,
  UPDATE_SETTINGS: Settings,
  NETWORK_ANALYSIS: Network,
  TIMELINE_VIEW: Clock,
  ENTITY_EXTRACTION: Activity,
};

const actionColors: Record<string, string> = {
  LOGIN: "text-green-500",
  LOGOUT: "text-gray-500",
  CREATE_CASE: "text-blue-500",
  DELETE_CASE: "text-red-500",
  DELETE_EVIDENCE: "text-red-500",
  UPLOAD_EVIDENCE: "text-green-500",
  RAG_QUERY: "text-purple-500",
  EXPORT_REPORT: "text-yellow-500",
};

function formatTime(ts: string) {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatActionLabel(action: string) {
  return action
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDateHeading(dateKey: string) {
  const today = new Date();
  const date = new Date(dateKey);
  const todayKey = today.toISOString().slice(0, 10);
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  if (dateKey === todayKey) return "Today";
  if (dateKey === yesterdayKey) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AuditTrailPage() {
  const { entries, exportAuditLogs, addAuditLog } = useAuditStore();
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateRange, setDateRange] = useState("7");

  // Initialize with sample data if empty
  useEffect(() => {
    if (entries.length === 0) {
      // Add sample audit logs to demonstrate functionality
      const sampleLogs = [
        {
          user: "John Doe",
          userId: "user-001",
          action: "LOGIN" as AuditAction,
          resource: "Dashboard",
          status: "success" as const,
          details: "Successful login from Chrome browser",
        },
        {
          user: "Jane Smith",
          userId: "user-002",
          action: "CREATE_CASE" as AuditAction,
          resource: "Case #2024-001",
          status: "success" as const,
          details: "New investigation case created",
          caseId: "case-001",
        },
        {
          user: "John Doe",
          userId: "user-001",
          action: "UPLOAD_EVIDENCE" as AuditAction,
          resource: "evidence-financial-records.pdf",
          status: "success" as const,
          details: "Uploaded financial records document",
          caseId: "case-001",
        },
        {
          user: "Mike Johnson",
          userId: "user-003",
          action: "RAG_QUERY" as AuditAction,
          resource: "Case #2024-001",
          status: "success" as const,
          details: "Query: What transactions occurred on Jan 15?",
          caseId: "case-001",
          duration: 1245,
        },
        {
          user: "Jane Smith",
          userId: "user-002",
          action: "NETWORK_ANALYSIS" as AuditAction,
          resource: "Case #2024-001",
          status: "success" as const,
          details: "Generated entity relationship graph",
          caseId: "case-001",
        },
        {
          user: "Admin User",
          userId: "user-admin",
          action: "DELETE_EVIDENCE" as AuditAction,
          resource: "evidence-duplicate.pdf",
          status: "failed" as const,
          details: "Insufficient permissions",
          errorMessage: "User does not have delete permissions",
        },
        {
          user: "John Doe",
          userId: "user-001",
          action: "EXPORT_REPORT" as AuditAction,
          resource: "Case #2024-001 Summary Report",
          status: "success" as const,
          details: "Exported case summary as PDF",
          caseId: "case-001",
        },
        {
          user: "Mike Johnson",
          userId: "user-003",
          action: "TIMELINE_VIEW" as AuditAction,
          resource: "Case #2024-001",
          status: "success" as const,
          details: "Viewed chronological timeline",
          caseId: "case-001",
        },
      ];

      // Add logs with slight delays to create realistic timestamps
      sampleLogs.reverse().forEach((log, index) => {
        setTimeout(() => {
          addAuditLog(log);
        }, index * 100);
      });
    }
  }, []);

  // Filter entries by current user
  const userEntries = user ? entries.filter((entry) => entry.userId === user.id) : [];

  const filtered = userEntries.filter((entry) => {
    const matchesSearch =
      !search.trim() ||
      entry.user.toLowerCase().includes(search.toLowerCase()) ||
      entry.action.toLowerCase().includes(search.toLowerCase()) ||
      entry.resource.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus =
      statusFilter === "all" || entry.status === statusFilter;
    
    const matchesAction =
      actionFilter === "all" || entry.action === actionFilter;

    const matchesDate = (() => {
      if (dateRange === "all") return true;
      const days = parseInt(dateRange);
      const entryDate = new Date(entry.timestamp);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      return entryDate >= cutoffDate;
    })();

    return matchesSearch && matchesStatus && matchesAction && matchesDate;
  });

  const groupedEntries = useMemo(() => {
    const groups = new Map<string, typeof filtered>();
    filtered.forEach((entry) => {
      const dateKey = new Date(entry.timestamp).toISOString().slice(0, 10);
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(entry);
    });
    const sortedKeys = Array.from(groups.keys()).sort((a, b) => b.localeCompare(a));
    return { groups, sortedKeys };
  }, [filtered]);

  // Calculate stats
  const stats = {
    total: filtered.length,
    successful: filtered.filter((e) => e.status === "success").length,
    failed: filtered.filter((e) => e.status === "failed").length,
    last24h: filtered.filter((e) => {
      const entryDate = new Date(e.timestamp);
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      return entryDate >= oneDayAgo;
    }).length,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Audit Trail</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete log of all system events with user attribution and IP tracking
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-4 sm:mb-6 grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Total Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">{stats.total}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              Last {dateRange === "all" ? "all time" : `${dateRange} days`}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Successful
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              <div className="text-xl sm:text-2xl font-bold text-foreground">{stats.successful}</div>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? ((stats.successful / stats.total) * 100).toFixed(1) : 0}% success rate
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
              <div className="text-xl sm:text-2xl font-bold text-foreground">{stats.failed}</div>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              Requires attention
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Last 24 Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <div className="text-xl sm:text-2xl font-bold text-foreground">{stats.last24h}</div>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              Recent activity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters Section */}
      <div className="mb-6 space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by user, action, resource..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 border-border bg-card pl-9 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
          />
        </div>
        
        {/* Filters & Export Row */}
        <div className="rounded-2xl border border-border bg-card/60 p-3 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Left: Filter Dropdowns */}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-full border-border bg-card text-sm text-foreground" suppressHydrationWarning>
                  <Filter className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="border-border bg-card">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="h-9 w-full border-border bg-card text-sm text-foreground" suppressHydrationWarning>
                  <Activity className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent className="border-border bg-card">
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="LOGOUT">Logout</SelectItem>
                  <SelectItem value="CREATE_CASE">Create Case</SelectItem>
                  <SelectItem value="UPLOAD_EVIDENCE">Upload Evidence</SelectItem>
                  <SelectItem value="RAG_QUERY">RAG Query</SelectItem>
                  <SelectItem value="EXPORT_REPORT">Export Report</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="h-9 w-full border-border bg-card text-sm text-foreground" suppressHydrationWarning>
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent className="border-border bg-card">
                  <SelectItem value="1">Last 24 Hours</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Right: Export Buttons */}
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-full border-border bg-card text-sm text-foreground hover:bg-muted sm:w-auto"
                onClick={() => {
                  exportAuditLogs("csv");
                  toast.success("Audit logs exported", {
                    description: "CSV file has been downloaded",
                  });
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-full border-border bg-card text-sm text-foreground hover:bg-muted sm:w-auto"
                onClick={() => {
                  exportAuditLogs("json");
                  toast.success("Audit logs exported", {
                    description: "JSON file has been downloaded",
                  });
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Export JSON
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Feed */}
      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border/60">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                Activity Feed
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Detailed events ordered by most recent activity
              </p>
            </div>
            <Badge variant="outline" className="border-border text-xs">
              {filtered.length} events
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-28rem)] w-full">
            <div className="space-y-6 p-4">
              {groupedEntries.sortedKeys.length > 0 ? (
                groupedEntries.sortedKeys.map((dateKey) => (
                  <div key={dateKey} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        {formatDateHeading(dateKey)}
                      </span>
                      <div className="h-px flex-1 bg-border" />
                      <Badge variant="outline" className="border-border text-[10px]">
                        {groupedEntries.groups.get(dateKey)?.length || 0} events
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {groupedEntries.groups.get(dateKey)!.map((entry) => {
                        const Icon = actionIcons[entry.action] || ShieldCheck;
                        const iconColor = actionColors[entry.action] || "text-muted-foreground";

                        return (
                          <Card key={entry.id} className="border-border bg-card/70 shadow-none">
                            <CardContent className="p-4">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex items-start gap-3">
                                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60">
                                    <Icon className={`h-4 w-4 ${iconColor}`} />
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-sm font-semibold text-foreground">
                                        {formatActionLabel(entry.action)}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className={
                                          entry.status === "success"
                                            ? "border-[#22c55e]/30 bg-[#22c55e]/10 text-[#22c55e] text-[10px]"
                                            : "border-[#ef4444]/30 bg-[#ef4444]/10 text-[#ef4444] text-[10px]"
                                        }
                                      >
                                        {entry.status}
                                      </Badge>
                                      {entry.duration && (
                                        <Badge variant="outline" className="border-border text-[10px]">
                                          {entry.duration}ms
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs font-medium text-foreground">
                                      {entry.resource}
                                    </p>
                                    {entry.details && (
                                      <p className="text-xs text-muted-foreground">
                                        {entry.details}
                                      </p>
                                    )}
                                    {entry.errorMessage && (
                                      <div className="flex items-start gap-1 text-[11px] text-red-400">
                                        <AlertCircle className="h-3.5 w-3.5" />
                                        <span>{entry.errorMessage}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground sm:flex-col sm:items-end">
                                  <span className="flex items-center gap-1">
                                    <User className="h-3.5 w-3.5" />
                                    {entry.user}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    {formatTime(entry.timestamp)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Globe className="h-3.5 w-3.5" />
                                    {entry.ip}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center gap-2 py-12">
                  <ShieldCheck className="h-6 w-6 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    {entries.length === 0
                      ? "No audit entries yet. Actions will be logged automatically."
                      : "No entries match your filters"}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
