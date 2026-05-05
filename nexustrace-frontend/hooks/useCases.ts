"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import { useActivityStore } from "@/store/activityStore";
import { useAuthStore } from "@/store/authStore";
import type { Case, CreateCaseRequest } from "@/types/case";
import type { Entity } from "@/types/case";
import type {
  AttackChainResponse,
  RelationTypeCount,
} from "@/types/graph";

export function useCases() {
  return useQuery<Case[]>({
    queryKey: ["cases"],
    queryFn: async () => {
      const res = await api.get("/cases");
      return res.data;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes - cases list changes moderately
  });
}

export function useCase(caseId: string) {
  return useQuery<Case>({
    queryKey: ["case", caseId],
    queryFn: async () => {
      const res = await api.get(`/cases/${caseId}`);
      return res.data;
    },
    enabled: !!caseId,
    staleTime: 2 * 60 * 1000, // 2 minutes - individual case can update frequently
  });
}

export function useCreateCase() {
  const queryClient = useQueryClient();
  const addActivity = useActivityStore((s) => s.addActivity);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (data: CreateCaseRequest) => {
      const res = await api.post<Case>("/cases", data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      
      // Track activity
      addActivity({
        type: "case",
        action: `Created new case: ${data.name || data.title || 'Untitled'}`,
        userId: user?.id || 'unknown',
        target: data.case_id || data.id || 'Unknown',
      });
      
      toast.success("Case created", {
        description: "Your new investigation case has been created",
      });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: unknown } };
      const data = err.response?.data;
      let description = "Failed to create case";
      
      // Handle Zod validation error (array)
      if (Array.isArray(data)) {
        const first = data[0];
        const msg =
          first && typeof first === "object" && "msg" in first
            ? (first as { msg?: unknown }).msg
            : undefined;
        description = typeof msg === "string" ? msg : "Validation failed";
      }
      // Handle single validation error object
      else if (data && typeof data === "object" && "msg" in data) {
        const msg = (data as { msg?: unknown }).msg;
        if (typeof msg === "string") {
          description = msg;
        }
      }
      // Handle API detail field (string)
      else if (data && typeof data === "object" && "detail" in data) {
        const detail = (data as { detail?: unknown }).detail;
        if (typeof detail === "string") {
          description = detail;
        }
      }
      
      toast.error("Failed to create case", { description });
    },
  });
}

export function useUpdateCase() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const addActivity = useActivityStore((s) => s.addActivity);

  return useMutation({
    mutationFn: async ({ caseId, data }: { caseId: string; data: Partial<Case> }) => {
      const res = await api.patch<Case>(`/cases/${caseId}`, data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["case", data.case_id || data.id] });
      
      // Track activity
      addActivity({
        type: "update",
        userId: user?.id || 'unknown',
        action: `Updated case: ${data.name || 'Case'}`,
        target: data.case_id || data.id || 'Unknown',
      });
      
      toast.success("Case updated", {
        description: "Case has been updated successfully",
      });
    },
    onError: (error: unknown) => {
      const err = error as { message?: string; response?: { data?: unknown } };
      const data = err.response?.data;
      let description = "Failed to update case";
      
      // Check if it's a network error (backend not running)
      if (err.message === "Network Error" || !err.response) {
        description = "Cannot connect to server. Please ensure the backend server is running on http://localhost:8000";
      } else if (Array.isArray(data)) {
        const first = data[0];
        const msg =
          first && typeof first === "object" && "msg" in first
            ? (first as { msg?: unknown }).msg
            : undefined;
        description = typeof msg === "string" ? msg : "Validation failed";
      } else if (data && typeof data === "object" && "msg" in data) {
        const msg = (data as { msg?: unknown }).msg;
        if (typeof msg === "string") {
          description = msg;
        }
      } else if (data && typeof data === "object" && "detail" in data) {
        const detail = (data as { detail?: unknown }).detail;
        if (typeof detail === "string") {
          description = detail;
        }
      }
      
      toast.error("Failed to update case", { description });
    },
  });
}

export function useDeleteCase() {
  const queryClient = useQueryClient();
  const addActivity = useActivityStore((s) => s.addActivity);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (caseId: string) => {
      const res = await api.delete(`/cases/${caseId}`);
      return res.data;
    },
    onSuccess: (_data, caseId) => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      
      addActivity({
        type: "delete",
        action: `Deleted case`,
        userId: user?.id || 'unknown',
        target: caseId,
      });
      
      toast.success("Case deleted", {
        description: "The case has been permanently removed",
      });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: unknown } };
      const data = err.response?.data;
      let description = "Failed to delete case";
      if (data && typeof data === "object" && "detail" in data) {
        const detail = (data as { detail?: unknown }).detail;
        if (typeof detail === "string") {
          description = detail;
        }
      }
      toast.error("Failed to delete case", { description });
    },
  });
}

export function useTimeline(caseId: string) {
  return useQuery({
    queryKey: ["timeline", caseId],
    queryFn: async () => {
      const res = await api.get(`/graph/timeline/${caseId}`);
      return res.data;
    },
    enabled: !!caseId,
  });
}

export function useEntities(caseId: string) {
  return useQuery({
    queryKey: ["entities", caseId],
    queryFn: async () => {
      const res = await api.get(`/graph/entities/${caseId}`);
      type GraphEntityRow = {
        id?: string;
        name?: string;
        type?: string;
        mentions?: number;
        risk_score?: number;
        properties?: Record<string, unknown>;
      };
      const rows: GraphEntityRow[] = Array.isArray(res.data) ? res.data : [];

      const mapType = (rawType?: string): Entity["type"] => {
        const normalized = (rawType || "").toUpperCase();
        if (normalized === "PERSON") return "person";
        if (normalized === "ORG") return "organization";
        if (normalized === "GPE") return "location";
        if (normalized === "EMAIL") return "email";
        if (normalized === "IP_ADDRESS") return "ip";
        if (normalized === "PHONE") return "phone";
        if (normalized === "PRODUCT") return "device";
        return "other";
      };

      const normalizeProperties = (props?: Record<string, unknown>): Record<string, string> => {
        if (!props) return {};
        return Object.fromEntries(
          Object.entries(props).map(([key, value]) => [key, String(value)])
        );
      };

      return rows.map((item) => ({
        id: item.id || `${item.name || "unknown"}-${item.type || "other"}`,
        name: item.name || "Unknown",
        type: mapType(item.type),
        mentions: Number(item.mentions || 0),
        risk_score: typeof item.risk_score === "number" ? item.risk_score : undefined,
        properties: normalizeProperties(item.properties),
      }));
    },
    enabled: !!caseId,
  });
}

export function usePrioritized(caseId: string) {
  return useQuery({
    queryKey: ["prioritized", caseId],
    queryFn: async () => {
      const res = await api.get(`/graph/prioritized/${caseId}`);
      return res.data;
    },
    enabled: !!caseId,
  });
}

export function useAttackChain(caseId: string) {
  return useQuery<AttackChainResponse>({
    queryKey: ["attack-chain", caseId],
    queryFn: async () => {
      const res = await api.get(`/graph/attack-chain/${caseId}`);
      return res.data;
    },
    enabled: !!caseId,
  });
}



export function useNetworkGraph(
  caseId: string,
  relationTypes?: string[],
  coOccursLimits?: { maxEntities?: number; maxEdges?: number }
) {
  const relationKey = relationTypes?.length
    ? [...relationTypes].sort().join(",")
    : "default";
  const includesCoOccurs = relationTypes?.includes("CO_OCCURS");
  const limitsKey = includesCoOccurs && coOccursLimits
    ? `${coOccursLimits.maxEntities ?? "d"}-${coOccursLimits.maxEdges ?? "d"}`
    : "no-co";

  return useQuery({
    queryKey: ["network", caseId, relationKey, limitsKey],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (relationTypes?.length) {
        params.relations = relationTypes.join(",");
      }
      if (includesCoOccurs && coOccursLimits?.maxEntities) {
        params.co_occurs_max_entities = String(coOccursLimits.maxEntities);
      }
      if (includesCoOccurs && coOccursLimits?.maxEdges) {
        params.co_occurs_max_edges = String(coOccursLimits.maxEdges);
      }

      const res = await api.get(`/graph/network/${caseId}`, {
        params: Object.keys(params).length ? params : undefined,
      });
      return res.data;
    },
    enabled: !!caseId,
  });
}

export function useNetworkRelations(caseId: string) {
  return useQuery<RelationTypeCount[]>({
    queryKey: ["network-relations", caseId],
    queryFn: async () => {
      const res = await api.get(`/graph/network/${caseId}/relations`);
      return res.data;
    },
    enabled: !!caseId,
  });
}

export function useMindmap(caseId: string) {
  return useQuery({
    queryKey: ["mindmap", caseId],
    queryFn: async () => {
      const res = await api.get(`/graph/mindmap/${caseId}`);
      return res.data;
    },
    enabled: !!caseId,
  });
}
