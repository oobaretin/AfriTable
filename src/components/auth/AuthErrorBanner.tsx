"use client";

import { resolveAuthErrorMessage } from "@/lib/auth/config";

type AuthErrorBannerProps = {
  errorCode?: string | null;
  message?: string | null;
};

export function AuthErrorBanner({ errorCode, message }: AuthErrorBannerProps) {
  const text = message ?? resolveAuthErrorMessage(errorCode ?? null);
  if (!text) return null;

  return <p className="text-sm font-medium text-destructive">{text}</p>;
}
