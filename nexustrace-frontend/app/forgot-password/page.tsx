"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Loader2, Copy, CheckCircle2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast.error("Email or username required", {
        description: "Enter the account email or username",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post("/auth/forgot-password", {
        identifier: identifier.trim(),
      });

      const resetToken = res.data?.reset_token;
      if (resetToken && typeof window !== "undefined") {
        const link = `${window.location.origin}/reset-password?token=${encodeURIComponent(resetToken)}`;
        setResetLink(link);
      } else {
        setResetLink(null);
      }

      toast.success("If the account exists, a reset link was sent", {
        description: "Check your inbox for password reset instructions",
      });
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      toast.error("Request failed", {
        description: typeof detail === "string" ? detail : "Please try again",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    if (!resetLink) return;
    try {
      await navigator.clipboard.writeText(resetLink);
      setLinkCopied(true);
      toast.success("Reset link copied");
      setTimeout(() => setLinkCopied(false), 1500);
    } catch {
      toast.error("Copy failed", {
        description: "Please copy the link manually",
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="mb-4 gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Card className="border-border bg-card">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl font-bold text-foreground">
            Reset your password
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your email or username to receive reset instructions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-foreground">
                Email or Username
              </Label>
              <Input
                id="identifier"
                type="text"
                placeholder="agent99 or agent@nexustrace.io"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="border-border bg-muted text-foreground"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full rounded-xl"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>

          {resetLink && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                <div className="space-y-2">
                  <p className="text-foreground">
                    Development shortcut: use this reset link.
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <span className="break-all text-[11px] text-muted-foreground">
                      {resetLink}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLink}
                      className="h-7 border-border text-[11px]"
                    >
                      <Copy className="mr-1 h-3 w-3" />
                      {linkCopied ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Remembered your password?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
