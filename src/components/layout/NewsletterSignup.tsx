"use client";

import * as React from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({ email: z.string().email() });

export default function NewsletterSignup() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      toast.error("Please enter a valid email.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: parsed.data.email, source: "footer" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.message || "Could not subscribe. Please try again.");
        return;
      }
      toast.success("You’re subscribed.");
      setEmail("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="grid gap-2" onSubmit={submit}>
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Mail className="h-4 w-4 text-primary" />
        Newsletter
      </div>
      <div className="text-sm text-muted-foreground">
        Get updates on new restaurants, cities, and features. No spam.
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          type="email"
          autoComplete="email"
          className="sm:max-w-sm"
          aria-label="Email address"
        />
        <Button type="submit" disabled={loading} className="sm:w-auto">
          {loading ? "Signing up…" : "Sign up"}
        </Button>
      </div>
      <div className="text-xs text-muted-foreground">
        By signing up, you agree to receive emails from AfriTable. Unsubscribe anytime.
      </div>
    </form>
  );
}

