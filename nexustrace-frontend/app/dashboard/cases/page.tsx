"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FolderOpen,
  Plus,
  Search,
  Filter,
  Clock,
  FileText,
} from "lucide-react";
import { useCases, useCreateCase } from "@/hooks/useCases";
import { useCaseStore } from "@/store/caseStore";
import { getCaseId, getCaseName, formatCaseStatus } from "@/lib/caseUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Case } from "@/types/case";

const statusColor: Record<string, string> = {
  open: "bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/30",
  in_progress: "bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30",
  closed: "bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30",
};

export default function AllCasesPage() {
  const { data: cases, isLoading } = useCases();
  const createCase = useCreateCase();
  const setCurrentCase = useCaseStore((s) => s.setCurrentCase);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const filteredCases = cases?.filter((c) => {
    const matchesSearch =
      getCaseName(c).toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      activeTab === "all" || (c.status || "open") === activeTab;
    return matchesSearch && matchesStatus;
  });

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

  const openCount = cases?.filter((c) => (c.status || "open") === "open").length || 0;
  const inProgressCount = cases?.filter((c) => (c.status || "open") === "in_progress").length || 0;
  const closedCount = cases?.filter((c) => (c.status || "open") === "closed").length || 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FolderOpen className="h-5 w-5 text-primary" />
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">All Cases</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Manage and search all investigation cases
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-xl w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                New Case
              </Button>
            </DialogTrigger>
            <DialogContent className="border-border bg-card">
              <DialogHeader>
                <DialogTitle className="text-foreground">Create New Case</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Start a new investigation case
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-foreground">
                    Case Title
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., Financial Fraud Investigation"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="border-border bg-muted text-foreground"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-foreground">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Provide details about the investigation..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="border-border bg-muted text-foreground min-h-24"
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
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search cases..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 border-border bg-muted/50 pl-9 text-sm w-full"
          />
        </div>
      </div>

      {/* Tabs for Status Filter */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4 sm:mb-6">
        <TabsList className="bg-muted/50 border border-border w-full sm:w-auto grid grid-cols-4 sm:inline-flex">
          <TabsTrigger value="all" className="text-[10px] sm:text-xs data-[state=active]:bg-card px-2 sm:px-3">
            <span className="hidden sm:inline">All Cases</span>
            <span className="sm:hidden">All</span>
            <span className="ml-1">({cases?.length || 0})</span>
          </TabsTrigger>
          <TabsTrigger value="open" className="text-[10px] sm:text-xs data-[state=active]:bg-card px-2 sm:px-3">
            <span className="hidden sm:inline">Open</span>
            <span className="sm:hidden">Open</span>
            <span className="ml-1">({openCount})</span>
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="text-[10px] sm:text-xs data-[state=active]:bg-card px-2 sm:px-3">
            <span className="hidden sm:inline">In Progress</span>
            <span className="sm:hidden">In Prog</span>
            <span className="ml-1">({inProgressCount})</span>
          </TabsTrigger>
          <TabsTrigger value="closed" className="text-[10px] sm:text-xs data-[state=active]:bg-card px-2 sm:px-3">
            <span className="hidden sm:inline">Closed</span>
            <span className="sm:hidden">Closed</span>
            <span className="ml-1">({closedCount})</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Separator className="mb-4 sm:mb-6 bg-border" />

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
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-primary shrink-0" />
                        <CardTitle className="text-sm font-semibold text-foreground line-clamp-1">
                          {getCaseName(c)}
                        </CardTitle>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] whitespace-nowrap ${statusColor[c.status || "open"] || statusColor.open}`}
                    >
                      {formatCaseStatus(c.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <CardDescription className="line-clamp-2 text-xs text-muted-foreground">
                    {c.description || "No description provided"}
                  </CardDescription>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
            {search ? "No cases found" : "No cases yet"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {search
              ? "Try adjusting your search criteria"
              : "Create your first investigation to get started"}
          </p>
          {!search && (
            <Button
              className="mt-6 gap-2 rounded-xl"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              New Case
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
