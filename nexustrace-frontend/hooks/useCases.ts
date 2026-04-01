"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import { useActivityStore } from "@/store/activityStore";
import { useAuthStore } from "@/store/authStore";
import type { Case, CreateCaseRequest } from "@/types/case";
import type { RelationTypeCount } from "@/types/graph";

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
    onError: (error: any) => {
      const data = error.response?.data;
      let description = "Failed to create case";
      
      // Handle Zod validation error (array)
      if (Array.isArray(data)) {
        description = data[0]?.msg || "Validation failed";
      }
      // Handle single validation error object
      else if (data && typeof data === "object" && data.msg) {
        description = data.msg;
      }
      // Handle API detail field (string)
      else if (typeof data?.detail === "string") {
        description = data.detail;
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
    onError: (error: any) => {
      const data = error.response?.data;
      let description = "Failed to update case";
      
      // Check if it's a network error (backend not running)
      if (error.message === "Network Error" || !error.response) {
        description = "Cannot connect to server. Please ensure the backend server is running on http://localhost:8000";
      } else if (Array.isArray(data)) {
        description = data[0]?.msg || "Validation failed";
      } else if (data && typeof data === "object" && data.msg) {
        description = data.msg;
      } else if (typeof data?.detail === "string") {
        description = data.detail;
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
        type: "delete" as any,
        action: `Deleted case`,
        userId: user?.id || 'unknown',
        target: caseId,
      });
      
      toast.success("Case deleted", {
        description: "The case has been permanently removed",
      });
    },
    onError: (error: any) => {
      const data = error.response?.data;
      let description = "Failed to delete case";
      if (typeof data?.detail === "string") {
        description = data.detail;
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
      // Get entities from network graph since /graph/entities endpoint has issues
      const networkRes = await api.get(`/graph/network/${caseId}`);
      const entityNodes = networkRes.data.nodes.filter(
        (node: any) => node.type === "Entity"
      );
      
      // Transform to Entity format
      return entityNodes.map((node: any) => ({
        id: node.id,
        name: node.label,
        type: node.properties?.type?.toLowerCase() || "other",
        mentions: 1, // Default value
        properties: node.properties
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
