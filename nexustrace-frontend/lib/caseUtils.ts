import type { Case } from "@/types/case";

/**
 * Get the case ID, preferring case_id over id
 */
export function getCaseId(c: Case): string {
  return c.case_id || c.id || "unknown";
}

/**
 * Get the case name, preferring name over title
 */
export function getCaseName(c: Case): string {
  return c.name || c.title || "Untitled Case";
}

/**
 * Get the case status with fallback
 */
export function getCaseStatus(c: Case): string {
  return c.status || "open";
}

/**
 * Format the case status for display (converts underscores to spaces)
 */
export function formatCaseStatus(status?: string): string {
  return (status || "open").replace(/_/g, " ");
}

/**
 * Format the created_at timestamp
 */
export function formatCaseDate(createdAt: string | number | undefined): string {
  if (!createdAt) return "Unknown date";
  const date = typeof createdAt === "number" ? new Date(createdAt) : new Date(createdAt);
  return date.toLocaleDateString();
}
