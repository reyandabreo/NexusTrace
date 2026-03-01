"use client";

import { memo, useCallback } from "react";
import Link from "next/link";
import { FolderOpen, Clock, FileText, Tag, AlertTriangle, AlertCircle, ArrowUp, ArrowDown } from "lucide-react";
import { getCaseId, getCaseName, formatCaseStatus } from "@/lib/caseUtils";
import { formatRelativeDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Case } from "@/types/case";

export const statusColor: Record<string, string> = {
  open: "bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/30",
  in_progress: "bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30",
  closed: "bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30",
};

export const priorityConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  critical: { label: "Critical", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: AlertCircle },
  high: { label: "High", color: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: AlertTriangle },
  medium: { label: "Medium", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: ArrowUp },
  low: { label: "Low", color: "bg-slate-500/20 text-slate-400 border-slate-500/30", icon: ArrowDown },
};

interface CaseCardProps {
  case: Case;
  onCaseClick: (c: Case) => void;
  selected?: boolean;
  onSelect?: (caseId: string, checked: boolean) => void;
  selectionMode?: boolean;
}

const CaseCard = memo(function CaseCard({ case: c, onCaseClick, selected, onSelect, selectionMode }: CaseCardProps) {
  const caseId = getCaseId(c);
  const priority = c.priority || "medium";
  const PriorityIcon = priorityConfig[priority]?.icon || ArrowUp;

  const handleCheckboxClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect?.(caseId, !selected);
  }, [caseId, selected, onSelect]);

  return (
    <Link
      href={`/dashboard/case/${caseId}`}
      onClick={() => onCaseClick(c)}
      className="h-full"
    >
      <Card className={`group h-full flex flex-col cursor-pointer border-border bg-card transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 ${selected ? "border-primary/60 ring-1 ring-primary/30 bg-primary/5" : ""}`}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              {selectionMode && (
                <div onClick={handleCheckboxClick} className="mt-0.5 shrink-0">
                  <Checkbox checked={selected} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-primary shrink-0" />
                  <CardTitle className="text-sm font-semibold text-foreground line-clamp-1">
                    {getCaseName(c)}
                  </CardTitle>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge
                variant="outline"
                className={`text-[10px] whitespace-nowrap px-1.5 py-0 ${priorityConfig[priority]?.color}`}
              >
                <PriorityIcon className="h-2.5 w-2.5 mr-0.5" />
                {priorityConfig[priority]?.label}
              </Badge>
              <Badge
                variant="outline"
                className={`text-[10px] whitespace-nowrap ${statusColor[c.status || "open"] || statusColor.open}`}
              >
                {formatCaseStatus(c.status)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 gap-2.5 pt-0">
          <CardDescription className="line-clamp-2 text-xs text-muted-foreground">
            {c.description || "No description provided"}
          </CardDescription>
          {/* Tags */}
          {c.tags && c.tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <Tag className="h-3 w-3 text-muted-foreground shrink-0" />
              {c.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-[9px] px-1.5 py-0 bg-muted/50 text-muted-foreground border-border"
                >
                  {tag}
                </Badge>
              ))}
              {c.tags.length > 3 && (
                <span className="text-[9px] text-muted-foreground">
                  +{c.tags.length - 3} more
                </span>
              )}
            </div>
          )}
          <div className="mt-auto flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 shrink-0">
              <Clock className="h-3 w-3" />
              <span className="truncate">{formatRelativeDate(c.created_at)}</span>
            </span>
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {c.evidence_count ?? 0} files
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
});

export default CaseCard;
