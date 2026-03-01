"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  FolderOpen,
  Plus,
  Search,
  ArrowUpDown,
  LayoutGrid,
  LayoutList,
  Trash2,
  Lock,
  Download,
  X,
  CheckSquare,
  AlertCircle,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Clock,
  FileText,
  Tag,
} from "lucide-react";
import { useCases, useCreateCase, useDeleteCase, useUpdateCase } from "@/hooks/useCases";
import { useDebounce } from "@/hooks/useDebounce";
import { useCaseStore } from "@/store/caseStore";
import { toast } from "sonner";
import { getCaseId, getCaseName, formatCaseStatus } from "@/lib/caseUtils";
import { formatRelativeDate } from "@/lib/utils";
import CaseCard, { statusColor, priorityConfig } from "@/components/cases/CaseCard";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Case } from "@/types/case";

type SortOption = "newest" | "oldest" | "name_asc" | "name_desc" | "priority" | "evidence";
type ViewMode = "grid" | "table";
type Priority = "low" | "medium" | "high" | "critical";

const sortLabels: Record<SortOption, string> = {
  newest: "Newest First",
  oldest: "Oldest First",
  name_asc: "Name (A–Z)",
  name_desc: "Name (Z–A)",
  priority: "Priority",
  evidence: "Evidence Count",
};

const priorityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };

export default function AllCasesPage() {
  const { data: cases, isLoading } = useCases();
  const createCase = useCreateCase();
  const deleteCase = useDeleteCase();
  const updateCase = useUpdateCase();
  const setCurrentCase = useCaseStore((s) => s.setCurrentCase);
  const searchParams = useSearchParams();
  const router = useRouter();

  // State
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Create form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  // Bulk selection state
  const [selectedCases, setSelectedCases] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);

  // Check for create query param
  useEffect(() => {
    if (searchParams.get("create") === "true") {
      setDialogOpen(true);
      router.replace("/dashboard/cases");
    }
  }, [searchParams, router]);

  // Filter, sort, paginate
  const filteredCases = useMemo(() => {
    if (!cases) return [];
    let result = cases.filter((c) => {
      const matchesSearch =
        getCaseName(c).toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        c.description.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (c.tags || []).some((t) => t.toLowerCase().includes(debouncedSearch.toLowerCase()));
      const matchesStatus =
        activeTab === "all" || (c.status || "open") === activeTab;
      return matchesSearch && matchesStatus;
    });

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "name_asc":
          return getCaseName(a).localeCompare(getCaseName(b));
        case "name_desc":
          return getCaseName(b).localeCompare(getCaseName(a));
        case "priority":
          return (priorityOrder[b.priority || "medium"] || 2) - (priorityOrder[a.priority || "medium"] || 2);
        case "evidence":
          return (b.evidence_count ?? 0) - (a.evidence_count ?? 0);
        default:
          return 0;
      }
    });

    return result;
  }, [cases, debouncedSearch, activeTab, sortBy]);

  const totalPages = Math.ceil((filteredCases.length || 0) / itemsPerPage);
  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCases.slice(start, start + itemsPerPage);
  }, [filteredCases, currentPage, itemsPerPage]);

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, filteredCases.length);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, activeTab, sortBy, itemsPerPage]);

  // Stats
  const openCount = cases?.filter((c) => (c.status || "open") === "open").length || 0;
  const inProgressCount = cases?.filter((c) => (c.status || "open") === "in_progress").length || 0;
  const closedCount = cases?.filter((c) => (c.status || "open") === "closed").length || 0;
  const totalCount = cases?.length || 0;

  // Handlers
  const handleCaseClick = useCallback((c: Case) => {
    setCurrentCase(c);
  }, [setCurrentCase]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title required", { description: "Please enter a case title" });
      return;
    }
    createCase.mutate(
      { name: title, description, priority, tags: tags.length > 0 ? tags : undefined },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setTitle("");
          setDescription("");
          setPriority("medium");
          setTags([]);
          setTagInput("");
        },
      }
    );
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  // Bulk actions
  const handleSelectCase = useCallback((caseId: string, checked: boolean) => {
    setSelectedCases((prev) => {
      const next = new Set(prev);
      if (checked) next.add(caseId);
      else next.delete(caseId);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedCases.size === paginatedCases.length) {
      setSelectedCases(new Set());
    } else {
      setSelectedCases(new Set(paginatedCases.map((c) => getCaseId(c))));
    }
  }, [paginatedCases, selectedCases.size]);

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedCases);
    if (ids.length === 0) return;
    for (const id of ids) {
      deleteCase.mutate(id);
    }
    setSelectedCases(new Set());
    setSelectionMode(false);
  }, [selectedCases, deleteCase]);

  const handleBulkClose = useCallback(async () => {
    const ids = Array.from(selectedCases);
    if (ids.length === 0) return;
    for (const id of ids) {
      updateCase.mutate({ caseId: id, data: { status: "closed" } });
    }
    setSelectedCases(new Set());
    setSelectionMode(false);
  }, [selectedCases, updateCase]);

  const handleExportSelected = useCallback(() => {
    if (!cases) return;
    const selected = cases.filter((c) => selectedCases.has(getCaseId(c)));
    const blob = new Blob([JSON.stringify(selected, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexustrace-cases-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export complete", { description: `Exported ${selected.length} case(s)` });
  }, [cases, selectedCases]);

  const toggleSelectionMode = useCallback(() => {
    setSelectionMode((prev) => {
      if (prev) setSelectedCases(new Set());
      return !prev;
    });
  }, []);

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
          <div className="flex items-center gap-2">
            {(activeTab === "all" || activeTab === "open") && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 rounded-xl w-full sm:w-auto" suppressHydrationWarning>
                    <Plus className="h-4 w-4" />
                    New Case
                  </Button>
                </DialogTrigger>
                <DialogContent className="border-border bg-card sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">Create New Case</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Start a new investigation case
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-foreground">Case Title</Label>
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
                      <Label htmlFor="description" className="text-foreground">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Provide details about the investigation..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="border-border bg-muted text-foreground min-h-20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Priority</Label>
                      <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                        <SelectTrigger className="border-border bg-muted text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Tags</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add tag and press Enter"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleTagKeyDown}
                          className="border-border bg-muted text-foreground flex-1"
                        />
                        <Button type="button" variant="outline" size="sm" onClick={handleAddTag} className="shrink-0">
                          Add
                        </Button>
                      </div>
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="gap-1 text-xs">
                              {tag}
                              <X
                                className="h-3 w-3 cursor-pointer hover:text-destructive"
                                onClick={() => handleRemoveTag(tag)}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
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
            )}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {!isLoading && cases && cases.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Cases</p>
                  <p className="text-2xl font-bold text-foreground">{totalCount}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FolderOpen className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Open</p>
                  <p className="text-2xl font-bold text-[#22c55e]">{openCount}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-[#22c55e]/10 flex items-center justify-center">
                  <FolderOpen className="h-5 w-5 text-[#22c55e]" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">In Progress</p>
                  <p className="text-2xl font-bold text-[#f59e0b]">{inProgressCount}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-[#f59e0b]/10 flex items-center justify-center">
                  <FolderOpen className="h-5 w-5 text-[#f59e0b]" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Closed</p>
                  <p className="text-2xl font-bold text-muted-foreground">{closedCount}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search, Sort, View Toggle, Bulk Actions */}
      <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search cases, descriptions, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 border-border bg-muted/50 pl-9 text-sm w-full"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sort */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="h-9 w-40 border-border bg-muted/50 text-sm">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(sortLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <div className="flex items-center border border-border rounded-lg bg-muted/50">
            <Button
              variant="ghost"
              size="sm"
              className={`h-9 px-2.5 rounded-r-none ${viewMode === "grid" ? "bg-card shadow-sm" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-9 px-2.5 rounded-l-none ${viewMode === "table" ? "bg-card shadow-sm" : ""}`}
              onClick={() => setViewMode("table")}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
          </div>

          {/* Bulk Select Toggle */}
          <Button
            variant={selectionMode ? "default" : "outline"}
            size="sm"
            className="h-9 gap-1.5"
            onClick={toggleSelectionMode}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Select</span>
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectionMode && selectedCases.size > 0 && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-xl border border-primary/30 bg-primary/5">
          <span className="text-sm font-medium text-foreground mr-2">
            {selectedCases.size} selected
          </span>
          <Separator orientation="vertical" className="h-5" />
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleBulkClose}>
            <Lock className="h-3.5 w-3.5" />
            Close
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleExportSelected}>
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={handleBulkDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
          <Button variant="ghost" size="sm" className="ml-auto text-xs" onClick={() => { setSelectedCases(new Set()); setSelectionMode(false); }}>
            <X className="h-3.5 w-3.5" />
            Cancel
          </Button>
        </div>
      )}

      {/* Tabs for Status Filter */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4 sm:mb-6">
        <TabsList className="bg-muted/50 border border-border w-full sm:w-auto grid grid-cols-4 sm:inline-flex">
          <TabsTrigger value="all" className="text-[10px] sm:text-xs data-[state=active]:bg-card px-2 sm:px-3">
            <span className="hidden sm:inline">All Cases</span>
            <span className="sm:hidden">All</span>
            <span className="ml-1">({totalCount})</span>
          </TabsTrigger>
          <TabsTrigger value="open" className="text-[10px] sm:text-xs data-[state=active]:bg-card px-2 sm:px-3">
            Open
            <span className="ml-1">({openCount})</span>
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="text-[10px] sm:text-xs data-[state=active]:bg-card px-2 sm:px-3">
            <span className="hidden sm:inline">In Progress</span>
            <span className="sm:hidden">Active</span>
            <span className="ml-1">({inProgressCount})</span>
          </TabsTrigger>
          <TabsTrigger value="closed" className="text-[10px] sm:text-xs data-[state=active]:bg-card px-2 sm:px-3">
            Closed
            <span className="ml-1">({closedCount})</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Separator className="mb-4 sm:mb-6 bg-border" />

      {/* Content */}
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
      ) : filteredCases.length > 0 ? (
        <>
          {/* Grid View */}
          {viewMode === "grid" && (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {paginatedCases.map((c: Case) => (
                <CaseCard
                  key={getCaseId(c)}
                  case={c}
                  onCaseClick={handleCaseClick}
                  selectionMode={selectionMode}
                  selected={selectedCases.has(getCaseId(c))}
                  onSelect={handleSelectCase}
                />
              ))}
            </div>
          )}

          {/* Table View */}
          {viewMode === "table" && (
            <Card className="border-border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    {selectionMode && (
                      <TableHead className="w-10">
                        <Checkbox
                          checked={selectedCases.size === paginatedCases.length && paginatedCases.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                    )}
                    <TableHead className="text-xs font-semibold">Name</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold">Priority</TableHead>
                    <TableHead className="text-xs font-semibold hidden md:table-cell">Tags</TableHead>
                    <TableHead className="text-xs font-semibold hidden lg:table-cell">Evidence</TableHead>
                    <TableHead className="text-xs font-semibold">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCases.map((c: Case) => {
                    const id = getCaseId(c);
                    const p = c.priority || "medium";
                    const PIcon = priorityConfig[p]?.icon || ArrowUp;
                    return (
                      <TableRow
                        key={id}
                        className={`border-border cursor-pointer ${selectedCases.has(id) ? "bg-primary/5" : ""}`}
                      >
                        {selectionMode && (
                          <TableCell>
                            <Checkbox
                              checked={selectedCases.has(id)}
                              onCheckedChange={(checked) => handleSelectCase(id, !!checked)}
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          <Link
                            href={`/dashboard/case/${id}`}
                            onClick={() => handleCaseClick(c)}
                            className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                          >
                            <FolderOpen className="h-4 w-4 text-primary shrink-0" />
                            <span className="line-clamp-1">{getCaseName(c)}</span>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] ${statusColor[c.status || "open"]}`}>
                            {formatCaseStatus(c.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] ${priorityConfig[p]?.color}`}>
                            <PIcon className="h-2.5 w-2.5 mr-0.5" />
                            {priorityConfig[p]?.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex gap-1 flex-wrap max-w-50">
                            {(c.tags || []).slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-[9px] px-1.5 py-0 bg-muted/50">
                                {tag}
                              </Badge>
                            ))}
                            {(c.tags || []).length > 2 && (
                              <span className="text-[9px] text-muted-foreground">+{c.tags!.length - 2}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <FileText className="h-3 w-3" />
                            {c.evidence_count ?? 0}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatRelativeDate(c.created_at)}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* Pagination */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>
                Showing {startIndex}–{endIndex} of {filteredCases.length} cases
              </span>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-1.5">
                <span className="text-xs">Per page:</span>
                <Select value={String(itemsPerPage)} onValueChange={(v) => setItemsPerPage(Number(v))}>
                  <SelectTrigger className="h-7 w-16 border-border bg-muted/50 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6</SelectItem>
                    <SelectItem value="12">12</SelectItem>
                    <SelectItem value="24">24</SelectItem>
                    <SelectItem value="48">48</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="h-8 w-8 rounded-lg p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-20">
          <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold text-foreground">
            {search
              ? "No cases found"
              : activeTab === "closed"
                ? "No cases closed"
                : activeTab === "open"
                  ? "No open cases"
                  : activeTab === "in_progress"
                    ? "No cases in progress"
                    : "No cases yet"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {search
              ? "Try adjusting your search criteria"
              : activeTab === "closed"
                ? "Cases marked as closed will appear here"
                : activeTab === "in_progress"
                  ? "Cases you're actively working on will appear here"
                  : "Create your first investigation to get started"}
          </p>
          {!search && (activeTab === "all" || activeTab === "open") && (
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
