"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FolderOpen,
  Users,
  FileText,
  ArrowRight,
  Clock,
} from "lucide-react";
import { useCases } from "@/hooks/useCases";
import { getCaseId, getCaseName, formatCaseStatus } from "@/lib/caseUtils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { data: cases } = useCases();

  // Keyboard shortcut: Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  // Reset query on close
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const filteredCases = useMemo(() => {
    if (!cases || !query.trim()) return cases || [];
    const q = query.toLowerCase();
    return cases.filter(
      (c) =>
        getCaseName(c).toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }, [cases, query]);

  const recentItems = [
    { label: "View all cases", href: "/dashboard", icon: FolderOpen },
    { label: "Analytics dashboard", href: "/dashboard/analytics", icon: FileText },
    { label: "Activity log", href: "/dashboard/activity", icon: Clock },
  ];

  const navigateTo = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden border-border bg-card p-0 sm:max-w-lg [&>button]:hidden">
        <DialogTitle className="sr-only">Global Search</DialogTitle>
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            placeholder="Search cases, entities, evidence..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-auto border-0 bg-transparent p-0 text-sm text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
            autoFocus
          />
          <kbd className="shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            ESC
          </kbd>
        </div>

        <ScrollArea className="max-h-80">
          <div className="p-2">
            {/* Quick Actions */}
            {!query.trim() && (
              <div className="mb-2">
                <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Quick Actions
                </p>
                {recentItems.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => navigateTo(item.href)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                ))}
              </div>
            )}

            {/* Cases */}
            <div>
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {query.trim() ? "Results" : "Cases"}
              </p>
              {filteredCases.length > 0 ? (
                filteredCases.slice(0, 8).map((c) => (
                  <button
                    key={getCaseId(c)}
                    onClick={() => navigateTo(`/dashboard/case/${getCaseId(c)}`)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted"
                  >
                    <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
                    <div className="flex-1 text-left">
                      <p className="font-medium text-foreground">{getCaseName(c)}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {c.description}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[9px] border-border"
                    >
                      {formatCaseStatus(c.status)}
                    </Badge>
                  </button>
                ))
              ) : (
                <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                  {query.trim()
                    ? "No results found"
                    : "No cases yet — create one to get started"}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
