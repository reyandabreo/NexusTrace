"use client";

import type { AxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import { useActivityStore } from "@/store/activityStore";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import type {
  RagResponse,
  RagExplanation,
  FeedbackRequest,
  ChatHistoryMessage,
  QueryHistory,
  RagProvider,
} from "@/types/rag";

type ApiErrorPayload = {
  msg?: string;
  detail?: string;
};

function getApiErrorDescription(error: unknown, fallback: string): string {
  const axiosError = error as AxiosError<ApiErrorPayload | ApiErrorPayload[]>;
  const data = axiosError.response?.data;

  if (Array.isArray(data)) {
    return data[0]?.msg || "Validation failed";
  }

  if (data && typeof data === "object" && typeof data.msg === "string") {
    return data.msg;
  }

  if (data && typeof data === "object" && typeof data.detail === "string") {
    return data.detail;
  }

  return fallback;
}

export function useRagAsk() {
  const addActivity = useActivityStore((s) => s.addActivity);
  const user = useAuthStore((s) => s.user);
  const addNotification = useNotificationStore((s) => s.addNotification);

  return useMutation({
    mutationFn: async (data: { question: string; case_id: string; chat_history?: ChatHistoryMessage[]; provider?: RagProvider }) => {
      const res = await api.post<RagResponse>("/rag/ask", data);
      return res.data;
    },
    onSuccess: (data, variables) => {
      // Track activity
      addActivity({
        type: "query",
        action: `Asked AI: "${variables.question.substring(0, 50)}${variables.question.length > 50 ? '...' : ''}"`,
        userId: user?.id || 'unknown',
        target: `Case ${variables.case_id}`,
      });

      // Add notification
      addNotification({
        type: "success",
        title: "AI Analysis Completed",
        description: "Your question has been analyzed and answered",
        caseId: variables.case_id,
        actionUrl: `/dashboard/case/${variables.case_id}/rag`,
      });
    },
    onError: (error: unknown) => {
      const description = getApiErrorDescription(error, "Could not get an answer");
      toast.error("RAG query failed", { description });
    },
  });
}

export function useRagExplanation() {
  return useMutation({
    mutationFn: async (queryId: string) => {
      const res = await api.get<RagExplanation>(`/rag/explanation/${queryId}`);
      const raw = res.data as Partial<RagExplanation> & {
        retrieved_chunks?: Array<Record<string, unknown>>;
        graph_expansion?: Array<Record<string, unknown>>;
        reasoning_summary?: string;
      };

      const normalizedChunks = Array.isArray(raw.retrieved_chunks)
        ? raw.retrieved_chunks.map((chunk, index) => {
            const similarity =
              typeof chunk?.similarity_score === "number"
                ? chunk.similarity_score
                : typeof chunk?.score === "number"
                  ? chunk.score
                  : 0;

            const content =
              typeof chunk?.content === "string"
                ? chunk.content
                : typeof chunk?.text === "string"
                  ? chunk.text
                  : "";

            const source = typeof chunk?.source === "string" ? chunk.source : "unknown";
            const chunkId =
              typeof chunk?.chunk_id === "string" && chunk.chunk_id
                ? chunk.chunk_id
                : `chunk-${index}`;

            return {
              chunk_id: chunkId,
              content,
              source,
              similarity_score: similarity,
            };
          })
        : [];

      const graphPath = Array.isArray(raw.graph_path)
        ? raw.graph_path.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        : [];

      const reasoning =
        typeof raw.reasoning === "string" && raw.reasoning.trim().length > 0
          ? raw.reasoning
          : typeof raw.reasoning_summary === "string"
            ? raw.reasoning_summary
            : "";

      return {
        query_id: raw.query_id || queryId,
        retrieved_chunks: normalizedChunks,
        graph_path: graphPath,
        reasoning,
      } satisfies RagExplanation;
    },
    onError: (error: unknown) => {
      const description = getApiErrorDescription(error, "Something went wrong");
      toast.error("Failed to load explanation", { description });
    },
  });
}

export function useQueryHistory(caseId?: string) {
  return useQuery<QueryHistory[]>({
    queryKey: caseId ? ["queryHistory", caseId] : ["queryHistory"],
    queryFn: async () => {
      const endpoint = caseId ? `/rag/history/${caseId}` : "/rag/history";
      const res = await api.get<QueryHistory[]>(endpoint);
      return res.data;
    },
    enabled: true,
  });
}

export function useFeedback() {
  return useMutation({
    mutationFn: async (data: FeedbackRequest) => {
      const res = await api.post("/feedback", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Feedback submitted", {
        description: "Thank you for your feedback",
      });
    },
    onError: (error: unknown) => {
      const description = getApiErrorDescription(error, "Could not submit feedback");
      toast.error("Feedback failed", { description });
    },
  });
}

export function useDeleteQueryHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ caseId, queryId }: { caseId: string; queryId: string }) => {
      const res = await api.delete(`/rag/history/${caseId}/${queryId}`);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["queryHistory", variables.caseId] });
      queryClient.invalidateQueries({ queryKey: ["queryHistory"] });
      toast.success("✅ Query deleted", {
        description: "The selected query was removed from history",
      });
    },
    onError: (error: unknown) => {
      const description = getApiErrorDescription(error, "Could not delete query");
      toast.error("❌ Delete failed", { description });
    },
  });
}
