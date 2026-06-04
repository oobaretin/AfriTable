"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { isGoogleAuthEnabled } from "@/lib/auth/config";
import { sanitizeRedirectPath } from "@/lib/auth/config";

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
  const enabled = isGoogleAuthEnabled();

  function handleClick() {
    if (!enabled) {
      onError?.("Google sign-in is not configured.");
      return;
    }

    const safeNext = sanitizeRedirectPath(redirectTo);
    const startUrl = `/api/auth/google/start?next=${encodeURIComponent(safeNext)}`;
    window.location.assign(startUrl);
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
    <Button type="button" variant="outline" onClick={handleClick} disabled={disabled}>
      {label}
    </Button>
  );
}
