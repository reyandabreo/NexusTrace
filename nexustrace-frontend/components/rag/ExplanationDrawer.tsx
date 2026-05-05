"use client";

import { useEffect } from "react";
import {
  Loader2,
  FileText,
  BarChart3,
  GitBranch,
  Sparkles,
  Search,
  Route,
} from "lucide-react";
import { useRagExplanation } from "@/hooks/useRag";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function ExplanationDrawer({
  queryId,
  open,
  onClose,
}: {
  queryId: string;
  open: boolean;
  onClose: () => void;
}) {
  const { mutate, isPending, data } = useRagExplanation();

  const retrievedChunks = Array.isArray(data?.retrieved_chunks)
    ? data.retrieved_chunks
    : [];
  const graphPath = Array.isArray(data?.graph_path) ? data.graph_path : [];
  const reasoning =
    typeof data?.reasoning === "string" && data.reasoning.trim().length > 0
      ? data.reasoning
      : "Reasoning details are not available for this response.";

  const toBulletPoints = (text: string): string[] => {
    if (!text) return [];

    const lines = text
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .flatMap((line) => line.split(/(?<=[.;:])\s+(?=[A-Z0-9(])/g))
      .map((segment) => segment.trim())
      .filter(Boolean);

    return lines.length > 1 ? lines : [text.trim()];
  };

  useEffect(() => {
    if (open && queryId) {
      mutate(queryId);
    }
  }, [mutate, open, queryId]);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-[min(100vw,42rem)] border-border bg-card p-0 sm:max-w-[42rem]">
        <div className="border-b border-border/70 bg-gradient-to-b from-muted/30 to-transparent px-6 py-5">
          <SheetHeader className="space-y-2 text-left">
            <SheetTitle className="flex items-center gap-2 text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Answer Explanation
            </SheetTitle>
            <SheetDescription className="text-muted-foreground">
              How the AI arrived at this answer
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
              {retrievedChunks.length} retrieved chunk{retrievedChunks.length === 1 ? "" : "s"}
            </Badge>
            <Badge variant="outline" className="border-border text-muted-foreground">
              {graphPath.length} graph hop{graphPath.length === 1 ? "" : "s"}
            </Badge>
            <Badge variant="outline" className="border-border text-muted-foreground">
              {data ? "Explanation ready" : "Waiting for data"}
            </Badge>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-150px)]">
          <div className="px-6 py-5">
            {isPending ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-3 text-sm font-medium text-foreground">Loading explanation</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Gathering reasoning, chunks, and graph path...
                </p>
              </div>
            ) : data ? (
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview" className="gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="chunks" className="gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    Chunks
                  </TabsTrigger>
                  <TabsTrigger value="path" className="gap-1.5">
                    <Route className="h-3.5 w-3.5" />
                    Path
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <Card className="border-border bg-card shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm text-foreground">
                        <GitBranch className="h-4 w-4 text-primary" />
                        Reasoning
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
                        <p className="text-sm leading-6 text-foreground/90">
                          {reasoning}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border bg-card shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm text-foreground">
                        <Search className="h-4 w-4 text-[#22c55e]" />
                        Quick Signals
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid gap-2 sm:grid-cols-3">
                        <div className="rounded-xl border border-border bg-muted/30 p-3">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Chunks</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">{retrievedChunks.length}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-muted/30 p-3">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Graph hops</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">{graphPath.length}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-muted/30 p-3">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Status</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">Structured trace</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="chunks" className="space-y-3">
                  {retrievedChunks.length > 0 ? (
                    retrievedChunks.map((chunk, index) => (
                      <Card
                        key={chunk.chunk_id || `${chunk.source || "chunk"}-${index}`}
                        className="border-border bg-card shadow-sm"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <CardTitle className="flex items-center gap-2 text-sm text-foreground">
                                <FileText className="h-4 w-4 text-primary" />
                                Chunk {index + 1}
                              </CardTitle>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {chunk.chunk_id || "Unknown chunk id"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="border-primary/30 bg-primary/10 text-[10px] text-primary"
                              >
                                {chunk.source || "Unknown source"}
                              </Badge>
                              <Badge variant="outline" className="border-border text-[10px] text-muted-foreground">
                                <BarChart3 className="h-3 w-3" />
                                {typeof chunk.similarity_score === "number"
                                  ? `${(chunk.similarity_score * 100).toFixed(1)}% match`
                                  : "Score unavailable"}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="rounded-2xl border border-border bg-muted/30 p-4">
                            {toBulletPoints(chunk.content || "No chunk content available.").length > 1 ? (
                              <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                                {toBulletPoints(chunk.content || "No chunk content available.").map((point, pointIndex) => (
                                  <li key={`${chunk.chunk_id || index}-${pointIndex}`} className="flex gap-2">
                                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                    <span className="min-w-0">{point}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm leading-6 text-muted-foreground">
                                {chunk.content || "No chunk content available."}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 text-center">
                      <FileText className="h-8 w-8 text-muted-foreground/40" />
                      <p className="mt-3 text-sm font-medium text-foreground">No retrieved chunks</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        The backend did not return retrieval details for this explanation.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="path" className="space-y-3">
                  {graphPath.length > 0 ? (
                    <Card className="border-border bg-card shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm text-foreground">
                          <Route className="h-4 w-4 text-[#22c55e]" />
                          Graph Path
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="rounded-2xl border border-border bg-muted/30 p-4">
                          <div className="flex flex-col items-start gap-3">
                            {graphPath.map((node, index) => (
                              <div key={`${node}-${index}`} className="flex w-full flex-col items-start gap-2">
                                <Badge
                                  variant="outline"
                                  className="border-border bg-card text-[10px] text-foreground"
                                >
                                  {node}
                                </Badge>
                                {index < graphPath.length - 1 && (
                                  <span className="ml-1 text-muted-foreground">↓</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 text-center">
                      <Route className="h-8 w-8 text-muted-foreground/40" />
                      <p className="mt-3 text-sm font-medium text-foreground">No graph path available</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        The query trace did not include graph hops.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 text-center">
                <p className="text-sm font-medium text-foreground">Could not load explanation</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try reopening the explanation or re-running the query.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
