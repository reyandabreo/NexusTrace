export interface RagQuery {
  question: string;
  case_id: string;
}

export interface RagChunk {
  chunk_id: string;
  content: string;
  source: string;
  similarity_score: number;
}

export interface RagResponse {
  query_id: string;
  answer: string;
  cited_chunks: string[];
  confidence: number;
  sources: string[];
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
  sources?: string[];
  timestamp: Date;
}

export interface FeedbackRequest {
  query_id: string;
  is_correct: boolean;
  comment?: string;
}
