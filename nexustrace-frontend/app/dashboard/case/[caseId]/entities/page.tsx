"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useEntities } from "@/hooks/useCases";
import { Users, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Entity } from "@/types/case";

const typeColors: Record<string, string> = {
  person: "bg-primary/20 text-primary border-primary/30",
  organization: "bg-[#a855f7]/20 text-[#a855f7] border-[#a855f7]/30",
  location: "bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/30",
  device: "bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30",
  email: "bg-[#06b6d4]/20 text-[#06b6d4] border-[#06b6d4]/30",
  ip: "bg-destructive/20 text-destructive border-destructive/30",
  phone: "bg-[#ec4899]/20 text-[#ec4899] border-[#ec4899]/30",
  other: "bg-muted text-muted-foreground border-border",
};

export default function EntitiesPage() {
  const params = useParams();
  const caseId = params?.caseId as string;
  const { data: entities, isLoading } = useEntities(caseId);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const entityData: Entity[] = entities || [];

  const filtered = entityData.filter((e) => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || e.type === typeFilter;
    return matchSearch && matchType;
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          Entities
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          People, organizations, and objects identified from evidence
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search entities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-border bg-card pl-10 text-foreground"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40 border-border bg-card text-foreground">
            <SelectValue placeholder="Filter type" />
          </SelectTrigger>
          <SelectContent className="border-border bg-card">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="person">Person</SelectItem>
            <SelectItem value="organization">Organization</SelectItem>
            <SelectItem value="location">Location</SelectItem>
            <SelectItem value="device">Device</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="ip">IP Address</SelectItem>
            <SelectItem value="phone">Phone</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-20">
          <Users className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold text-foreground">
            No entities found
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Process evidence to extract entities
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((entity) => (
            <Card
              key={entity.id}
              className="border-border bg-card transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-semibold text-foreground">
                    {entity.name}
                  </h3>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${typeColors[entity.type] || typeColors.other}`}
                  >
                    {entity.type}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {entity.mentions} mentions
                  {entity.risk_score !== undefined &&
                    ` · Risk: ${(entity.risk_score * 100).toFixed(0)}%`}
                </p>
                {entity.properties &&
                  Object.keys(entity.properties).length > 0 && (
                    <div className="mt-3 space-y-1">
                      {Object.entries(entity.properties)
                        .slice(0, 3)
                        .map(([k, v]) => (
                          <p
                            key={k}
                            className="text-xs text-muted-foreground"
                          >
                            <span className="text-foreground/70">{k}:</span>{" "}
                            {v}
                          </p>
                        ))}
                    </div>
                  )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
