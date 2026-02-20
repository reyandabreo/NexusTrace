"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Search,
  Filter,
  User,
  Clock,
  Globe,
  Key,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useAuditStore, AuditAction } from "@/store/auditStore";

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

export default function AuditTrailPage() {
  const { entries, exportAuditLogs, addAuditLog } = useAuditStore();
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

  const filtered = entries.filter((entry) => {
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

      {/* Filters */}
      <div className="mb-6 space-y-3">
        {/* Search Bar - Full Width */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by user, action, resource..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 border-border bg-card pl-9 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
          />
        </div>
        
        {/* Filter Controls & Export Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:flex-wrap">
          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 w-40 border-border bg-card text-sm text-foreground hover:bg-muted/50">
                <Filter className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Status" className="text-foreground" />
              </SelectTrigger>
              <SelectContent className="border-border bg-card">
                <SelectItem value="all" className="text-foreground">All Status</SelectItem>
                <SelectItem value="success" className="text-foreground">Success</SelectItem>
                <SelectItem value="failed" className="text-foreground">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="h-10 w-40 border-border bg-card text-sm text-foreground hover:bg-muted/50">
                <Activity className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Action" className="text-foreground" />
              </SelectTrigger>
              <SelectContent className="border-border bg-card">
                <SelectItem value="all" className="text-foreground">All Actions</SelectItem>
                <SelectItem value="LOGIN" className="text-foreground">Login</SelectItem>
                <SelectItem value="LOGOUT" className="text-foreground">Logout</SelectItem>
                <SelectItem value="CREATE_CASE" className="text-foreground">Create Case</SelectItem>
                <SelectItem value="UPLOAD_EVIDENCE" className="text-foreground">Upload Evidence</SelectItem>
                <SelectItem value="RAG_QUERY" className="text-foreground">RAG Query</SelectItem>
                <SelectItem value="EXPORT_REPORT" className="text-foreground">Export Report</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="h-10 w-38.75 border-border bg-card text-sm text-foreground hover:bg-muted/50">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Date" className="text-foreground" />
              </SelectTrigger>
              <SelectContent className="border-border bg-card">
                <SelectItem value="1" className="text-foreground">Last 24 Hours</SelectItem>
                <SelectItem value="7" className="text-foreground">Last 7 days</SelectItem>
                <SelectItem value="30" className="text-foreground">Last 30 days</SelectItem>
                <SelectItem value="90" className="text-foreground">Last 90 days</SelectItem>
                <SelectItem value="all" className="text-foreground">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="h-10 border-border bg-card text-foreground hover:bg-muted/50 hover:text-foreground"
              onClick={() => exportAuditLogs("csv")}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10 border-border bg-card text-foreground hover:bg-muted/50 hover:text-foreground"
              onClick={() => exportAuditLogs("json")}
            >
              <Download className="mr-2 h-4 w-4" />
              Export JSON
            </Button>
          </div>
        </div>
      </div>

      {/* Audit Table */}
      <Card className="border-border bg-card">
        <div className="overflow-x-auto">
          <ScrollArea className="h-[calc(100vh-28rem)] w-full">
            <Table className="min-w-200">
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Timestamp
                </TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  User
                </TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Action
                </TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Resource
                </TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  IP Address
                </TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Details
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? (
                filtered.map((entry) => {
                  const Icon = actionIcons[entry.action] || ShieldCheck;
                  const iconColor = actionColors[entry.action] || "text-muted-foreground";
                  
                  return (
                    <TableRow
                      key={entry.id}
                      className="border-border hover:bg-muted/30"
                    >
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {formatTime(entry.timestamp)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted">
                            <User className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <span className="text-xs font-medium text-foreground">
                            {entry.user}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
                          <span className="text-xs text-foreground">
                            {entry.action.replace(/_/g, " ")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-48 truncate">
                        {entry.resource}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {entry.ip}
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-64 truncate">
                        {entry.details || "-"}
                        {entry.duration && (
                          <span className="ml-2 text-[10px] text-primary">
                            ({entry.duration}ms)
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <ShieldCheck className="h-6 w-6 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">
                        {entries.length === 0 
                          ? "No audit entries yet. Actions will be logged automatically." 
                          : "No entries match your filters"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        </div>
      </Card>
    </div>
  );
}
