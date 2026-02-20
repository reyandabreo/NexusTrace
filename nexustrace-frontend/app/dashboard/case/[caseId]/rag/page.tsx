"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { MessageSquare, Send, Bot, User, Loader2 } from "lucide-react";
import { useRagAsk } from "@/hooks/useRag";
import { useActivityStore } from "@/store/activityStore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatMessage from "@/components/rag/ChatMessage";
import type { ChatMessage as ChatMessageType } from "@/types/rag";

export default function RagPage() {
  const params = useParams();
  const caseId = params?.caseId as string;
  const ragAsk = useRagAsk();
  const addActivity = useActivityStore((s) => s.addActivity);
  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm ready to answer questions about your investigation. I'll search through the uploaded evidence to provide cited, explainable answers.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || ragAsk.isPending) return;

    const userMsg: ChatMessageType = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    try {
      const response = await ragAsk.mutateAsync({
        question: input.trim(),
        case_id: caseId,
      });

      // Track activity
      addActivity({
        type: "query",
        action: `Asked AI: "${input.trim().substring(0, 50)}${input.trim().length > 50 ? '...' : ''}"`,
        target: `Case ${caseId}`,
      });

      const assistantMsg: ChatMessageType = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.answer,
        query_id: response.query_id,
        cited_chunks: response.cited_chunks,
        sources: response.sources,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatMessageType = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content:
          "I encountered an error processing your question. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">
              AI Assistant
            </h1>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
              RAG Active
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-6 py-4">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} caseId={caseId} />
          ))}

          {ragAsk.isPending && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing evidence...
                </div>
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <div className="relative flex items-end gap-2 rounded-2xl border border-border bg-card p-2">
            <Textarea
              placeholder="Ask a question about your documents..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-10 max-h-30 flex-1 resize-none border-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
              rows={1}
            />
            <Button
              size="icon"
              className="h-9 w-9 rounded-xl"
              onClick={handleSend}
              disabled={!input.trim() || ragAsk.isPending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
