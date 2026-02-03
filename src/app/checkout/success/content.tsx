"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    // Could verify the session here if needed
    if (!sessionId) {
      router.push("/");
    }
  }, [sessionId, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-success" />
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-3xl text-foreground">
            Good job, human.
          </h1>
          <p className="text-muted-foreground text-lg">
            Your payment was successful. I am ready to seat your event.
          </p>
        </div>

        <div className="bg-card border-2 border-primary/20 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Sparkles className="w-5 h-5" />
            <span className="font-medium">Your credits are ready</span>
          </div>
          <p className="text-sm text-muted-foreground">
            You can now create events and let me do what I do best.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button asChild variant="hero" size="lg">
            <Link href="/admin">
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          A receipt has been sent to your email. 🐕
        </p>
      </div>
    </div>
  );
}
