"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { useUploadEvidence } from "@/hooks/useUpload";
import { Card, CardContent } from "@/components/ui/card";

export default function EvidenceUpload({ caseId }: { caseId: string }) {
  const upload = useUploadEvidence();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      upload.mutate({ caseId, file });
    },
    [caseId, upload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6">
        <label
          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 transition-colors ${
            isDragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/40"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          {upload.isPending ? (
            <>
              <Loader2 className="mb-3 h-10 w-10 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">
                Uploading...
              </p>
            </>
          ) : (
            <>
              <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                Click to upload or drag and drop
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                PDF, TXT, MD or DOCX (max. 10MB)
              </p>
            </>
          )}
          <input
            type="file"
            className="hidden"
            accept=".pdf,.txt,.md,.docx"
            onChange={handleChange}
            disabled={upload.isPending}
          />
        </label>
      </CardContent>
    </Card>
  );
}
