"use client";

import { useState } from "react";
import { Bot, User, ThumbsUp, ThumbsDown, Eye } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFeedback, useRagExplanation } from "@/hooks/useRag";
import ExplanationDrawer from "@/components/rag/ExplanationDrawer";
import type { ChatMessage as ChatMessageType } from "@/types/rag";

export default function ChatMessage({
  message,
  caseId,
}: {
  message: ChatMessageType;
  caseId: string;
}) {
  const feedback = useFeedback();
  const [feedbackGiven, setFeedbackGiven] = useState<boolean | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const isAssistant = message.role === "assistant";

  const handleFeedback = (isCorrect: boolean) => {
    if (!message.query_id) return;
    feedback.mutate({ query_id: message.query_id, is_correct: isCorrect });
    setFeedbackGiven(isCorrect);
  };

  return (
    <>
      <div
        className={`flex items-start gap-3 ${isAssistant ? "" : "flex-row-reverse"}`}
      >
        {/* Avatar */}
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
            isAssistant ? "bg-primary/10" : "bg-[#22c55e]/10"
          }`}
        >
          {isAssistant ? (
            <Bot className="h-4 w-4 text-primary" />
          ) : (
            <User className="h-4 w-4 text-[#22c55e]" />
          )}
        </div>

        {/* Message */}
        <div
          className={`max-w-[80%] ${
            isAssistant
              ? "rounded-2xl rounded-tl-sm border border-border bg-card"
              : "rounded-2xl rounded-tr-sm bg-primary text-primary-foreground"
          } px-4 py-3`}
        >
          <div className="prose prose-sm prose-invert max-w-none text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Sources */}
          {isAssistant && message.sources && message.sources.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {message.sources.map((source, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="text-[10px] bg-primary/10 text-primary border-primary/30"
                >
                  {source}
                </Badge>
              ))}
            </div>
          )}

          {/* Actions */}
          {isAssistant && message.query_id && (
            <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 gap-1.5 text-xs ${
                  feedbackGiven === true
                    ? "text-[#22c55e]"
                    : "text-muted-foreground hover:text-[#22c55e]"
                }`}
                onClick={() => handleFeedback(true)}
                disabled={feedbackGiven !== null}
              >
                <ThumbsUp className="h-3 w-3" />
                Correct
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 gap-1.5 text-xs ${
                  feedbackGiven === false
                    ? "text-destructive"
                    : "text-muted-foreground hover:text-destructive"
                }`}
                onClick={() => handleFeedback(false)}
                disabled={feedbackGiven !== null}
              >
                <ThumbsDown className="h-3 w-3" />
                Incorrect
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-primary"
                onClick={() => setShowExplanation(true)}
              >
                <Eye className="h-3 w-3" />
                Explain
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Timestamp */}
      <p
        className={`text-[10px] text-muted-foreground ${isAssistant ? "ml-11" : "mr-11 text-right"}`}
      >
        {message.timestamp.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>

      {/* Explanation Drawer */}
      {showExplanation && message.query_id && (
        <ExplanationDrawer
          queryId={message.query_id}
          open={showExplanation}
          onClose={() => setShowExplanation(false)}
        />
      )}
    </>
  );
}
