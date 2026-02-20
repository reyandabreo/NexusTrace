"use client";

import { useParams } from "next/navigation";
import { useTimeline } from "@/hooks/useCases";
import { Clock, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { TimelineEvent } from "@/types/case";

export default function TimelinePage() {
  const params = useParams();
  const caseId = params?.caseId as string;
  const { data: events, isLoading } = useTimeline(caseId);

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const timelineData: TimelineEvent[] = events || [];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <Clock className="h-6 w-6 text-primary" />
          Investigation Timeline
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chronological view of events extracted from evidence
        </p>
      </div>

      {timelineData.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-20">
          <Clock className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold text-foreground">
            No timeline data yet
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload and process evidence to generate the timeline
          </p>
        </div>
      ) : (
        <div className="relative ml-8">
          {/* Timeline line */}
          <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-6">
            {timelineData.map((event, idx) => (
              <div key={event.id || idx} className="relative pl-8">
                {/* Dot */}
                <div
                  className={`absolute -left-2 top-2 h-2.5 w-2.5 rounded-full border-2 ${
                    event.risk_score && event.risk_score > 0.7
                      ? "border-destructive bg-destructive"
                      : "border-primary bg-primary"
                  }`}
                />

                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                      <h3 className="mt-1 text-sm font-semibold text-foreground">
                        {event.description}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Source: {event.source}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {event.risk_score && event.risk_score > 0.7 && (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                      <Badge
                        variant="outline"
                        className="text-[10px] border-border text-muted-foreground"
                      >
                        {event.event_type}
                      </Badge>
                    </div>
                  </div>
                  {event.entities.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {event.entities.map((ent, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="text-[10px] bg-primary/10 text-primary border-primary/30"
                        >
                          {ent}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
