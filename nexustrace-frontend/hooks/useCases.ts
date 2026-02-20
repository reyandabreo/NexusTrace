"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import { useActivityStore } from "@/store/activityStore";
import type { Case, CreateCaseRequest } from "@/types/case";

export function useCases() {
  return useQuery<Case[]>({
    queryKey: ["cases"],
    queryFn: async () => {
      const res = await api.get("/cases");
      return res.data;
    },
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
  });
}

export function useCreateCase() {
  const queryClient = useQueryClient();
  const addActivity = useActivityStore((s) => s.addActivity);

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

export function useNetworkGraph(caseId: string) {
  return useQuery({
    queryKey: ["network", caseId],
    queryFn: async () => {
      const res = await api.get(`/graph/network/${caseId}`);
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
