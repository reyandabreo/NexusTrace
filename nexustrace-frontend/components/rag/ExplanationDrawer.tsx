"use client";

import { useEffect } from "react";
import { Loader2, FileText, BarChart3, GitBranch } from "lucide-react";
import { useRagExplanation } from "@/hooks/useRag";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function ExplanationDrawer({
  queryId,
  open,
  onClose,
}: {
  queryId: string;
  open: boolean;
  onClose: () => void;
}) {
  const explanation = useRagExplanation();

  useEffect(() => {
    if (open && queryId) {
      explanation.mutate(queryId);
    }
  }, [open, queryId]);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-112.5  border-border bg-card sm:max-w-112.5">
        <SheetHeader>
          <SheetTitle className="text-foreground">
            Answer Explanation
          </SheetTitle>
          <SheetDescription className="text-muted-foreground">
            How the AI arrived at this answer
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="mt-6 h-[calc(100vh-120px)] pr-4">
          {explanation.isPending ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">
                Loading explanation...
              </p>
            </div>
          ) : explanation.data ? (
            <div className="space-y-6">
              {/* Reasoning */}
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <GitBranch className="h-4 w-4 text-primary" />
                  Reasoning
                </h3>
                <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                  {explanation.data.reasoning}
                </p>
              </div>

              <Separator className="bg-border" />

              {/* Retrieved Chunks */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <FileText className="h-4 w-4 text-primary" />
                  Retrieved Chunks
                </h3>
                <div className="space-y-3">
                  {explanation.data.retrieved_chunks.map((chunk) => (
                    <div
                      key={chunk.chunk_id}
                      className="rounded-xl border border-border bg-muted p-4"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-primary/10 text-primary border-primary/30"
                        >
                          {chunk.source}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs">
                          <BarChart3 className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {(chunk.similarity_score * 100).toFixed(1)}% match
                          </span>
                        </div>
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {chunk.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-border" />

              {/* Graph Path */}
              {explanation.data.graph_path.length > 0 && (
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <GitBranch className="h-4 w-4 text-[#22c55e]" />
                    Graph Path
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    {explanation.data.graph_path.map((node, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] border-border text-foreground"
                        >
                          {node}
                        </Badge>
                        {i < explanation.data!.graph_path.length - 1 && (
                          <span className="text-muted-foreground">→</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-sm text-muted-foreground">
                Could not load explanation
              </p>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
