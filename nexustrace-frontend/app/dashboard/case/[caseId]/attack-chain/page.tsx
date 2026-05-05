"use client";

import { useParams } from "next/navigation";
import { AlertTriangle, ArrowRight, Radar, Shield } from "lucide-react";
import { useAttackChain } from "@/hooks/useCases";
import AttackChainMermaid from "@/components/cases/AttackChainMermaid";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const chainStatusLabel: Record<string, string> = {
  insufficient_signal: "Insufficient Signal",
  early_stage: "Early Stage Chain",
  multi_stage: "Multi-Stage Chain",
  probable_end_to_end: "Probable End-to-End Chain",
};

function toPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function confidenceClass(value: number): string {
  if (value >= 0.75) return "text-destructive";
  if (value >= 0.5) return "text-[#f59e0b]";
  return "text-[#22c55e]";
}

function compactEventId(eventId: string): string {
  if (!eventId) return "unknown";
  return eventId.length > 10 ? eventId.slice(0, 10) : eventId;
}

function formatGeneratedAt(value: string): string {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function splitNarrativeOverview(overview: string): string[] {
  if (!overview) return [];

  const tagged = overview
    .replace(/\s+(Then:|Next:|After that:|Later:|Finally:)/g, "\n$1")
    .trim();

  const structured = tagged
    .split("\n")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => segment.replace(/^(First:|Then:|Next:|After that:|Later:|Finally:)\s*/i, "").trim())
    .filter(Boolean);

  if (structured.length > 1) {
    return structured.slice(0, 8);
  }

  return overview
    .split(/(?<=\.)\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .slice(0, 8);
}

export default function AttackChainPage() {
  const params = useParams();
  const caseId = params?.caseId as string;
  const { data, isLoading, isError } = useAttackChain(caseId);

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-8">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-20">
          <AlertTriangle className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold text-foreground">Unable to reconstruct attack chain</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Verify evidence has been processed and try again.
          </p>
        </div>
      </div>
    );
  }

  const stages = data.identified_stages || [];
  const uncovered = data.uncovered_stages || [];
  const logicalFlow = data.logical_flow || [];
  const narrativeOverview = data.narrative_overview || "";
  const statusLabel = chainStatusLabel[data.chain_status] || data.chain_status;
  const storylineSteps = splitNarrativeOverview(narrativeOverview);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-2xl font-bold text-foreground">
          <Shield className="h-6 w-6 text-primary" />
          Attack Chain Reconstruction
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Probable adversary sequence mapped to MITRE ATT&CK techniques.
        </p>
      </div>

      {storylineSteps.length > 0 && (
        <div className="mb-6">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-5">
              <h2 className="text-base font-semibold text-foreground">Incident Storyline</h2>
              <ol className="mt-3 space-y-2">
                {storylineSteps.map((step, index) => (
                  <li key={`${index}-${step.slice(0, 30)}`} className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-[10px] font-semibold text-primary">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-relaxed text-muted-foreground">{step}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      )}

      {logicalFlow.length > 0 && (
        <div className="mb-8">
          <AttackChainMermaid caseId={caseId} />
        </div>
      )}

      {logicalFlow.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-foreground">Logical Flow of Events</h2>
          <div className="space-y-3">
            {logicalFlow.map((step, index) => (
              <div key={`${step.title}-${index}`}>
                <Card className="border-border bg-card">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="border-primary/30 bg-primary/10 text-primary"
                        >
                          {index + 1}
                        </Badge>
                        <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                      </div>
                      <p className="text-xs font-medium text-muted-foreground">{step.time_window}</p>
                    </div>

                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.summary}</p>

                    {step.related_stages.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {step.related_stages.map((stage) => (
                          <Badge
                            key={`${step.title}-${stage}`}
                            variant="outline"
                            className="border-border text-[10px] text-muted-foreground"
                          >
                            {stage}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {index < logicalFlow.length - 1 && (
                  <div className="relative flex h-12 items-center justify-center">
                    <span className="absolute top-0 h-4 w-px bg-border" />
                    <span className="absolute bottom-0 h-4 w-px bg-border" />
                    <span className="z-10 inline-flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
                      <ArrowRight className="h-3.5 w-3.5 rotate-90" />
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Overall Confidence</p>
            <p className={`mt-1 text-2xl font-semibold ${confidenceClass(data.overall_confidence)}`}>
              {toPercent(data.overall_confidence)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Chain Status</p>
            <Badge variant="outline" className="mt-2 border-primary/30 bg-primary/10 text-primary">
              {statusLabel}
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Timeline Events</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{data.timeline_event_count}</p>
          </CardContent>
        </Card>
      </div>

      {stages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <h3 className="text-base font-semibold text-foreground">No mapped attack stages yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add richer behavioral evidence to improve stage and technique coverage.
          </p>
        </div>
      ) : (
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Mapped MITRE Stages</h2>
              <p className="text-xs text-muted-foreground">
                Technical mapping is available, but hidden by default to keep the page readable.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {stages.map((stage) => (
              <Badge
                key={stage.stage}
                variant="outline"
                className="border-border bg-muted/30 text-xs text-foreground"
              >
                {stage.stage} ({toPercent(stage.confidence)})
              </Badge>
            ))}
          </div>

          <details className="mt-4 rounded-xl border border-border bg-card">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-foreground">
              Show detailed MITRE techniques
            </summary>
            <div className="space-y-3 px-4 pb-4">
              {stages.map((stage) => (
                <Card key={stage.stage} className="border-border bg-card">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-foreground">{stage.stage}</h3>
                        <p className="text-xs text-muted-foreground">{stage.summary}</p>
                      </div>
                      <p className={`text-sm font-semibold ${confidenceClass(stage.confidence)}`}>
                        {toPercent(stage.confidence)}
                      </p>
                    </div>

                    <div className="mt-3 space-y-2">
                      {stage.techniques.slice(0, 4).map((technique) => (
                        <div
                          key={`${stage.stage}-${technique.technique_id}`}
                          className="rounded-md border border-border bg-muted/20 p-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="border-border text-[10px] text-muted-foreground">
                                {technique.technique_id}
                              </Badge>
                              <p className="text-sm font-medium text-foreground">{technique.technique_name}</p>
                            </div>
                            <p className={`text-xs font-semibold ${confidenceClass(technique.confidence)}`}>
                              {toPercent(technique.confidence)}
                            </p>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">Tactic: {technique.tactic}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{technique.rationale}</p>
                          {technique.evidence_event_ids.length > 0 && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Evidence IDs: {technique.evidence_event_ids.slice(0, 3).map(compactEventId).join(", ")}
                              {technique.evidence_event_ids.length > 3
                                ? ` +${technique.evidence_event_ids.length - 3}`
                                : ""}
                            </p>
                          )}
                        </div>
                      ))}
                      {stage.techniques.length > 4 && (
                        <p className="text-xs text-muted-foreground">
                          +{stage.techniques.length - 4} additional mapped technique(s)
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </details>
        </div>
      )}

      {uncovered.length > 0 && (
        <div className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <Radar className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Coverage Gaps</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {uncovered.map((gap) => (
              <Card key={gap.stage} className="border-border bg-card">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold text-foreground">{gap.stage}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{gap.reason}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {gap.recommended_artifacts.map((artifact) => (
                      <Badge
                        key={`${gap.stage}-${artifact}`}
                        variant="outline"
                        className="border-border bg-muted/30 text-[10px] text-muted-foreground"
                      >
                        {artifact}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        Generated: {formatGeneratedAt(data.generated_at)}
      </p>
    </div>
  );
}
