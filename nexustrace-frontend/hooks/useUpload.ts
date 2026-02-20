"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import { useActivityStore } from "@/store/activityStore";
import { useAuditLogger } from "@/store/auditStore";
import type { Evidence } from "@/types/case";

export function useUploadEvidence() {
  const queryClient = useQueryClient();
  const addActivity = useActivityStore((s) => s.addActivity);
  const { logAction } = useAuditLogger();

  return useMutation({
    mutationFn: async ({
      caseId,
      file,
    }: {
      caseId: string;
      file: File;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("case_id", caseId);

      const res = await api.post<Evidence>("/evidence/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["case", variables.caseId] });
      queryClient.invalidateQueries({ queryKey: ["evidenceList", variables.caseId] });
      queryClient.invalidateQueries({ queryKey: ["network", variables.caseId] });
      
      // Track activity
      addActivity({
        type: "evidence",
        action: `Uploaded evidence: ${variables.file.name}`,
        target: `Case ${variables.caseId}`,
      });
      
      // Log audit trail
      logAction("UPLOAD_EVIDENCE", variables.file.name, {
        status: "success",
        details: `Uploaded ${variables.file.name} (${(variables.file.size / 1024).toFixed(2)} KB)`,
        caseId: variables.caseId,
      });
      
      toast.success("Evidence uploaded", {
        description: "File has been uploaded and is being processed",
      });
    },
    onError: (error: any, variables) => {
      const data = error.response?.data;
      let description = "Could not upload file";
      
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
      
      // Log failed upload
      logAction("UPLOAD_EVIDENCE", variables.file.name, {
        status: "failed",
        details: `Failed to upload ${variables.file.name}`,
        caseId: variables.caseId,
        errorMessage: description,
      });
      
      toast.error("Upload failed", { description });
    },
  });
}

export function useEvidence(evidenceId: string) {
  return useQuery<Evidence>({
    queryKey: ["evidence", evidenceId],
    queryFn: async () => {
      const res = await api.get(`/evidence/${evidenceId}`);
      return res.data;
    },
    enabled: !!evidenceId,
  });
}

export function useEvidenceList(caseId: string) {
  return useQuery<Evidence[]>({
    queryKey: ["evidenceList", caseId],
    queryFn: async () => {
      console.log("[useEvidenceList] Fetching evidence for case:", caseId);
      
      // Get evidence IDs from network graph
      const networkRes = await api.get(`/graph/network/${caseId}`);
      console.log("[useEvidenceList] Network response:", networkRes.data);
      
      const evidenceNodes = networkRes.data.nodes.filter(
        (node: any) => node.type === "Evidence"
      );
      console.log("[useEvidenceList] Found evidence nodes:", evidenceNodes);
      
      if (evidenceNodes.length === 0) {
        console.warn("[useEvidenceList] No evidence nodes found in network graph");
        return [];
      }
      
      // Fetch details for each evidence
      const evidenceDetails = await Promise.all(
        evidenceNodes.map(async (node: any) => {
          // Extract evidence_id from node properties or parse from node.id
          const evidenceId = node.properties?.evidence_id || node.id.split(':')[1] || node.id;
          console.log("[useEvidenceList] Fetching details for evidence:", evidenceId, "from node:", node);
          const res = await api.get(`/evidence/${evidenceId}`);
          console.log("[useEvidenceList] Evidence details:", res.data);
          return res.data;
        })
      );
      
      console.log("[useEvidenceList] All evidence details:", evidenceDetails);
      return evidenceDetails;
    },
    enabled: !!caseId,
  });
}
