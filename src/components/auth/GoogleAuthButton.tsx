"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isGoogleAuthEnabled } from "@/lib/auth/config";
import { signInWithGoogle } from "@/lib/auth/google-oauth";

type GoogleAuthButtonProps = {
  label?: string;
  redirectTo?: string;
  disabled?: boolean;
  onError?: (message: string) => void;
};

export function GoogleAuthButton({
  label = "Continue with Google",
  redirectTo = "/",
  disabled = false,
  onError,
}: GoogleAuthButtonProps) {
  const [isPending, startTransition] = React.useTransition();
  const enabled = isGoogleAuthEnabled();

  function handleClick() {
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await signInWithGoogle(supabase, {
        origin: window.location.origin,
        redirectTo,
      });
      if (error) onError?.(error.message);
    });
  }

  if (!enabled) {
    return (
      <div className="grid gap-2">
        <Button type="button" variant="outline" disabled>
          {label} (not configured)
        </Button>
        <p className="text-xs text-muted-foreground">
          Enable Google in Supabase Auth, then set{" "}
          <code className="rounded bg-muted px-1">NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=true</code> and redeploy.
        </p>
      </div>
    );
  }

  return (
    <Button type="button" variant="outline" onClick={handleClick} disabled={disabled || isPending}>
      {isPending ? "Redirecting to Google…" : label}
    </Button>
  );
}
