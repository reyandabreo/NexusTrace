"use client";

import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Clock,
  Users,
  AlertTriangle,
  Network,
  BrainCircuit,
  MessageSquare,
  ArrowLeft,
  Trash2,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCaseName, formatCaseStatus } from "@/lib/caseUtils";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCaseStore } from "@/store/caseStore";

const statusColor: Record<string, string> = {
  open: "border-[#22c55e]/30 bg-[#22c55e]/10 text-[#22c55e]",
  in_progress: "border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#f59e0b]",
  closed: "border-muted-foreground/30 bg-muted-foreground/10 text-muted-foreground",
};

export default function CaseSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const caseId = params?.caseId as string;
  const selectedCase = useCaseStore((s) => s.selectedCase);
  const base = `/dashboard/case/${caseId}`;

  const navItems = [
    { href: base, label: "Overview", icon: LayoutDashboard },
    { href: `${base}/timeline`, label: "Timeline", icon: Clock },
    { href: `${base}/entities`, label: "Entities", icon: Users },
    {
      href: `${base}/prioritized`,
      label: "Prioritized Leads",
      icon: AlertTriangle,
    },
    { href: `${base}/network`, label: "Network Graph", icon: Network },
    { href: `${base}/mindmap`, label: "Mindmap", icon: BrainCircuit },
    { href: `${base}/rag`, label: "AI Assistant", icon: MessageSquare },
  ];

  return (
    <aside className="flex h-full w-56 flex-col border-r border-border bg-sidebar shrink-0">
      {/* Back to Dashboard */}
      <div className="p-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Cases
        </Link>
      </div>

      <Separator className="bg-border" />

      {/* Case Info */}
      <div className="p-4 space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Investigation
        </p>
        <h2 className="text-sm font-semibold text-foreground truncate">
          {selectedCase ? getCaseName(selectedCase) : `Case ${caseId.slice(0, 8)}...`}
        </h2>
        <div className="flex items-center gap-2">
          {selectedCase?.status && (
            <Badge
              variant="outline"
              className={`text-[9px] ${statusColor[selectedCase.status] || statusColor.open}`}
            >
              {formatCaseStatus(selectedCase.status)}
            </Badge>
          )}
          {selectedCase?.created_at && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <CalendarDays className="h-3 w-3" />
              {new Date(selectedCase.created_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <Separator className="bg-border" />

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              item.href === base
                ? pathname === base
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Case Actions */}
      <div className="border-t border-border p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-xs text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete Case
        </Button>
      </div>
    </aside>
  );
}
