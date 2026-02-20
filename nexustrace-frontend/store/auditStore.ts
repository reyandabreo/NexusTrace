import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AuditAction =
  | "LOGIN"
  | "LOGOUT"
  | "CREATE_CASE"
  | "DELETE_CASE"
  | "UPDATE_CASE"
  | "UPLOAD_EVIDENCE"
  | "DELETE_EVIDENCE"
  | "RAG_QUERY"
  | "EXPORT_REPORT"
  | "VIEW_CASE"
  | "SHARE_CASE"
  | "UPDATE_SETTINGS"
  | "NETWORK_ANALYSIS"
  | "TIMELINE_VIEW"
  | "ENTITY_EXTRACTION";

export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  userId: string;
  action: AuditAction;
  resource: string;
  details?: string;
  ip: string;
  userAgent: string;
  status: "success" | "failed";
  errorMessage?: string;
  caseId?: string;
  duration?: number; // in milliseconds
}

interface AuditStore {
  entries: AuditEntry[];
  addAuditLog: (log: Omit<AuditEntry, "id" | "timestamp" | "ip" | "userAgent">) => void;
  clearAuditLogs: () => void;
  getEntriesByCase: (caseId: string) => AuditEntry[];
  getEntriesByUser: (userId: string) => AuditEntry[];
  getEntriesByDateRange: (startDate: Date, endDate: Date) => AuditEntry[];
  exportAuditLogs: (format: "json" | "csv") => void;
}

// Helper function to get client IP (simplified - in production use server-side)
function getClientIP(): string {
  // In a real app, this would come from the server
  // For now, return a placeholder
  return "192.168.1." + Math.floor(Math.random() * 255);
}

// Helper function to get user agent
function getUserAgent(): string {
  return typeof navigator !== "undefined" 
    ? navigator.userAgent 
    : "Unknown";
}

export const useAuditStore = create<AuditStore>()(
  persist(
    (set, get) => ({
      entries: [],

      addAuditLog: (log) => {
        const newEntry: AuditEntry = {
          ...log,
          id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          ip: getClientIP(),
          userAgent: getUserAgent(),
        };

        set((state) => ({
          entries: [newEntry, ...state.entries].slice(0, 1000), // Keep last 1000 entries
        }));
      },

      clearAuditLogs: () => set({ entries: [] }),

      getEntriesByCase: (caseId: string) => {
        return get().entries.filter((entry) => entry.caseId === caseId);
      },

      getEntriesByUser: (userId: string) => {
        return get().entries.filter((entry) => entry.userId === userId);
      },

      getEntriesByDateRange: (startDate: Date, endDate: Date) => {
        return get().entries.filter((entry) => {
          const entryDate = new Date(entry.timestamp);
          return entryDate >= startDate && entryDate <= endDate;
        });
      },

      exportAuditLogs: (format: "json" | "csv") => {
        const entries = get().entries;
        
        if (format === "json") {
          const dataStr = JSON.stringify(entries, null, 2);
          const dataBlob = new Blob([dataStr], { type: "application/json" });
          const url = URL.createObjectURL(dataBlob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `audit-logs-${new Date().toISOString().split("T")[0]}.json`;
          link.click();
          URL.revokeObjectURL(url);
        } else if (format === "csv") {
          const headers = ["Timestamp", "User", "Action", "Resource", "IP", "Status", "Details"];
          const csvRows = [
            headers.join(","),
            ...entries.map((entry) =>
              [
                entry.timestamp,
                entry.user,
                entry.action,
                `"${entry.resource.replace(/"/g, '""')}"`,
                entry.ip,
                entry.status,
                `"${(entry.details || "").replace(/"/g, '""')}"`,
              ].join(",")
            ),
          ];
          const csvStr = csvRows.join("\n");
          const dataBlob = new Blob([csvStr], { type: "text/csv" });
          const url = URL.createObjectURL(dataBlob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
          link.click();
          URL.revokeObjectURL(url);
        }
      },
    }),
    {
      name: "audit-storage",
    }
  )
);

// Helper hook to easily log audit events
export function useAuditLogger() {
  const addAuditLog = useAuditStore((state) => state.addAuditLog);
  
  const logAction = (
    action: AuditAction,
    resource: string,
    options?: {
      status?: "success" | "failed";
      details?: string;
      caseId?: string;
      duration?: number;
      errorMessage?: string;
    }
  ) => {
    // Get current user from localStorage (since we're in a hook)
    let user = "Unknown User";
    let userId = "unknown";
    
    if (typeof window !== "undefined") {
      try {
        const authData = localStorage.getItem("nexustrace-auth");
        if (authData) {
          const parsed = JSON.parse(authData);
          if (parsed.state?.user) {
            user = parsed.state.user.name || parsed.state.user.email || "User";
            userId = parsed.state.user.id || "unknown";
          }
        }
      } catch (e) {
        console.error("Failed to get user from auth store", e);
      }
    }
    
    addAuditLog({
      user,
      userId,
      action,
      resource,
      status: options?.status || "success",
      details: options?.details,
      caseId: options?.caseId,
      duration: options?.duration,
      errorMessage: options?.errorMessage,
    });
  };

  return { logAction };
}
