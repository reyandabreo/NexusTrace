"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import type { RagResponse, RagExplanation, FeedbackRequest } from "@/types/rag";

export function useRagAsk() {
  return useMutation({
    mutationFn: async (data: { question: string; case_id: string }) => {
      const res = await api.post<RagResponse>("/rag/ask", data);
      return res.data;
    },
    onError: (error: any) => {
      const data = error.response?.data;
      let description = "Could not get an answer";
      
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
      
      toast.error("RAG query failed", { description });
    },
  });
}

export function useRagExplanation() {
  return useMutation({
    mutationFn: async (queryId: string) => {
      const res = await api.get<RagExplanation>(`/rag/explanation/${queryId}`);
      return res.data;
    },
    onError: (error: any) => {
      const data = error.response?.data;
      let description = "Something went wrong";
      
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
      
      toast.error("Failed to load explanation", { description });
    },
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
    onError: (error: any) => {
      const data = error.response?.data;
      let description = "Could not submit feedback";
      
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
      
      toast.error("Feedback failed", { description });
    },
  });
}
