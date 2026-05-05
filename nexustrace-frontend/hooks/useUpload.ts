"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import { useActivityStore } from "@/store/activityStore";
import { useAuthStore } from "@/store/authStore";
import { useAuditLogger } from "@/store/auditStore";
import { useNotificationStore } from "@/store/notificationStore";
import type { Evidence } from "@/types/case";

export function useUploadEvidence() {
  const queryClient = useQueryClient();
  const addActivity = useActivityStore((s) => s.addActivity);
  const user = useAuthStore((s) => s.user);
  const { logAction } = useAuditLogger();
  const addNotification = useNotificationStore((s) => s.addNotification);

  const invalidateCaseQueries = (caseId: string) => {
    queryClient.invalidateQueries({ queryKey: ["case", caseId] });
    queryClient.invalidateQueries({ queryKey: ["cases"] });
    queryClient.invalidateQueries({ queryKey: ["evidenceList", caseId] });
    queryClient.invalidateQueries({ queryKey: ["network", caseId] });
    queryClient.invalidateQueries({ queryKey: ["timeline", caseId] });
    queryClient.invalidateQueries({ queryKey: ["entities", caseId] });
    queryClient.invalidateQueries({ queryKey: ["prioritized", caseId] });
    queryClient.invalidateQueries({ queryKey: ["network-relations", caseId] });
    queryClient.invalidateQueries({ queryKey: ["mindmap", caseId] });
  };

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
    onSuccess: (_data, variables) => {
      invalidateCaseQueries(variables.caseId);
      
      // Track activity
      addActivity({
        type: "evidence",
        action: `Uploaded evidence: ${variables.file.name}`,
        userId: user?.id || 'unknown',
        target: `Case ${variables.caseId}`,
      });
      
      // Log audit trail
      logAction("UPLOAD_EVIDENCE", variables.file.name, {
        status: "success",
        details: `Uploaded ${variables.file.name} (${(variables.file.size / 1024).toFixed(2)} KB)`,
        caseId: variables.caseId,
      });
      
      // Add notification
      addNotification({
        type: "success",
        title: "Evidence Uploaded Successfully",
        description: `${variables.file.name} has been uploaded and is being processed`,
        caseId: variables.caseId,
        actionUrl: `/dashboard/case/${variables.caseId}`,
      });
      
      // Show processing notification
      setTimeout(() => {
        addNotification({
          type: "processing",
          title: "Processing Evidence",
          description: `Extracting entities and analyzing ${variables.file.name}...`,
          caseId: variables.caseId,
        });
      }, 1000);
      
      toast.success("Evidence uploaded", {
        description: "File has been uploaded and is being processed",
      });
    },
    onError: (error: unknown, variables) => {
      type ErrorPayload = { msg?: string; detail?: string };
      const data = (error as { response?: { data?: unknown } })?.response?.data;
      let description = "Could not upload file";
      
      // Handle Zod validation error (array)
      if (Array.isArray(data)) {
        const firstError = data[0] as ErrorPayload | undefined;
        description = firstError?.msg || "Validation failed";
      }
      // Handle single validation error object
      else if (data && typeof data === "object") {
        const payload = data as ErrorPayload;
        if (payload.msg) {
          description = payload.msg;
        } else if (typeof payload.detail === "string") {
          description = payload.detail;
        }
      }
      
      // Log failed upload
      logAction("UPLOAD_EVIDENCE", variables.file.name, {
        status: "failed",
        details: `Failed to upload ${variables.file.name}`,
        caseId: variables.caseId,
        errorMessage: description,
      });
      
      // Add error notification
      addNotification({
        type: "alert",
        title: "Upload Failed",
        description: `Could not upload ${variables.file.name}: ${description}`,
        caseId: variables.caseId,
      });
      
      toast.error("Upload failed", { description });
    },
    onSettled: (_data, _error, variables) => {
      if (variables?.caseId) {
        invalidateCaseQueries(variables.caseId);
      }
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
    staleTime: 10 * 60 * 1000, // 10 minutes - evidence rarely changes after upload
  });
}

export function useEvidenceList(caseId: string) {
  return useQuery<Evidence[]>({
    queryKey: ["evidenceList", caseId],
    queryFn: async () => {
      const res = await api.get(`/evidence/case/${caseId}`);
      type CaseEvidenceRow = {
        id?: string;
        evidence_id?: string;
        filename?: string;
        file_type?: string;
        created_at?: string | null;
        uploaded_at?: string | null;
      };
      const rows: CaseEvidenceRow[] = Array.isArray(res.data) ? res.data : [];

      return rows
        .map((item) => ({
          evidence_id: item.evidence_id || item.id,
          filename: item.filename || "Unknown",
          file_type: item.file_type || "txt",
          created_at: item.created_at || item.uploaded_at || null,
        }))
        .filter((item: any) => Boolean(item.evidence_id)) as Evidence[];
    },
    enabled: !!caseId,
    staleTime: 30 * 1000,
  });
}
