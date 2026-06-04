"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { sanitizeRedirectPath } from "@/lib/auth/config";

function profilePatchFromUser(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}) {
  const meta = user.user_metadata ?? {};
  const fullName =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    user.email ||
    "AfriTable user";
  const avatarUrl =
    (typeof meta.avatar_url === "string" && meta.avatar_url) ||
    (typeof meta.picture === "string" && meta.picture) ||
    null;

  return {
    id: user.id,
    full_name: fullName,
    ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
  };
}

function AuthCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [message, setMessage] = React.useState("Completing sign-in…");
  const startedRef = React.useRef(false);

  React.useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const code = params.get("code");
    const next = sanitizeRedirectPath(params.get("next"));
    const oauthError = params.get("error");

    if (oauthError) {
      window.location.assign(`/login?error=${encodeURIComponent(oauthError)}`);
      return;
    }

    if (!code) {
      window.location.assign("/login?error=missing_oauth_code");
      return;
    }

    const authCode = code;

    async function completeSignIn() {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(authCode);

      if (error) {
        window.location.assign("/login?error=oauth_exchange_failed");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (data.user) {
        void supabase.from("profiles").upsert(profilePatchFromUser(data.user), { onConflict: "id" });
      }

      if (!session) {
        setMessage("Sign-in could not be verified. Redirecting…");
        window.location.assign("/login?error=oauth_exchange_failed");
        return;
      }

      router.replace(next);
      router.refresh();
    }

    void completeSignIn().catch(() => {
      setMessage("Sign-in failed. Redirecting…");
      window.location.assign("/login?error=oauth_exchange_failed");
    });
  }, [params, router]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function AuthCallbackFallback() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Completing sign-in…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackFallback />}>
      <AuthCallbackInner />
    </Suspense>
  );
}
