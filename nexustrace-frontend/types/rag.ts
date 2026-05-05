export type RagProvider = "auto" | "openai" | "gemini";

export interface RagQuery {
  question: string;
  case_id: string;
  chat_history?: ChatHistoryMessage[];
  provider?: RagProvider;
}

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface RagChunk {
  chunk_id: string;
  content: string;
  source: string;
  similarity_score: number;
}

export interface SourceAttribution {
  filename: string;
  evidence_id: string;
  file_type: string;
  pages_referenced: number[];
}

export interface RagResponse {
  query_id: string;
  answer: string;
  cited_chunks: string[];
  reasoning_summary: string;
  confidence_score: number;
  sources: SourceAttribution[];
  provider_requested?: RagProvider;
  provider_used?: string;
}

export interface RagExplanation {
  query_id: string;
  retrieved_chunks: RagChunk[];
  graph_path: string[];
  reasoning: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  query_id?: string;
  cited_chunks?: string[];
  sources?: SourceAttribution[];
  confidence?: number;
  provider_used?: string;
  timestamp: Date;
}

export interface FeedbackRequest {
  query_id: string;
  is_correct: boolean;
  comment?: string;
}

export interface QueryHistory {
  query_id: string;
  case_id: string;
  question: string;
  answer: string | null;
  timestamp: number;
  chunks_retrieved: number;
}
