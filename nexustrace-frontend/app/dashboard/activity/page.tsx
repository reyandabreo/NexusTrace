"use client";

import {
  Activity,
  FolderOpen,
  FileText,
  MessageSquare,
  Upload,
  Trash2,
  Eye,
  Search,
  Filter,
  Edit,
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
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useMemo } from "react";
import { useActivityStore } from "@/store/activityStore";

const typeConfig = {
  case: { icon: FolderOpen, color: "text-primary", bg: "bg-primary/10", badge: "Case" },
  evidence: { icon: Upload, color: "text-[#22c55e]", bg: "bg-[#22c55e]/10", badge: "Evidence" },
  query: { icon: MessageSquare, color: "text-[#a855f7]", bg: "bg-[#a855f7]/10", badge: "AI Query" },
  view: { icon: Eye, color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10", badge: "View" },
  update: { icon: Edit, color: "text-[#06b6d4]", bg: "bg-[#06b6d4]/10", badge: "Update" },
  delete: { icon: Trash2, color: "text-[#ef4444]", bg: "bg-[#ef4444]/10", badge: "Delete" },
};

function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ActivityLogPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const allActivities = useActivityStore((s) => s.activities);
  
  // Memoize the sliced activities to avoid re-creating array on every render
  const activities = useMemo(() => allActivities.slice(0, 50), [allActivities]);

  const filtered = activities.filter((a) => {
    const matchesSearch =
      !search.trim() ||
      a.action.toLowerCase().includes(search.toLowerCase()) ||
      a.target.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || a.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Activity Log</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Track all actions performed across your investigations
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search activities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 border-border bg-muted/50 pl-9 text-sm"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-9 w-40 border-border bg-muted/50 text-sm">
            <Filter className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent className="border-border bg-popover">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="case">Cases</SelectItem>
            <SelectItem value="evidence">Evidence</SelectItem>
            <SelectItem value="query">AI Queries</SelectItem>
            <SelectItem value="view">Views</SelectItem>
            <SelectItem value="update">Updates</SelectItem>
            <SelectItem value="delete">Deletions</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Activity Feed */}
      <Card className="border-border bg-card">
        <ScrollArea className="h-[calc(100vh-16rem)]">
          <div className="divide-y divide-border">
            {filtered.length > 0 ? (
              filtered.map((activity) => {
                const config = typeConfig[activity.type];
                const Icon = config.icon;
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-muted/30"
                  >
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.bg}`}
                    >
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {activity.action}
                        </p>
                        <Badge
                          variant="outline"
                          className="border-border px-1.5 py-0 text-[9px] text-muted-foreground"
                        >
                          {config.badge}
                        </Badge>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {activity.target}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] text-muted-foreground/60">
                      {formatRelativeTime(activity.timestamp)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <Activity className="mb-3 h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No activities found</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
