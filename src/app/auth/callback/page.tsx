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

  React.useEffect(() => {
    const code = params.get("code");
    const next = sanitizeRedirectPath(params.get("next"));
    const oauthError = params.get("error");

    if (oauthError) {
      router.replace(`/login?error=${encodeURIComponent(oauthError)}`);
      return;
    }

    if (!code) {
      router.replace("/login?error=missing_oauth_code");
      return;
    }

    const authCode = code;

    async function completeSignIn() {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(authCode);

      if (error) {
        // #region agent log
        fetch("http://127.0.0.1:7668/ingest/f4aec2f7-622b-445a-95fa-99041b9558b2", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "379971" },
          body: JSON.stringify({
            sessionId: "379971",
            runId: "auth-client-callback-v4",
            hypothesisId: "H4",
            location: "auth/callback/page:exchange",
            message: "client exchange failed",
            data: { errorMessage: error.message },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        router.replace("/login?error=oauth_exchange_failed");
        return;
      }

      if (data.user) {
        await supabase.from("profiles").upsert(profilePatchFromUser(data.user), { onConflict: "id" });
      }

      document.cookie = "auth_client_ok=1; path=/; max-age=300; SameSite=Lax";

      // #region agent log
      const probe = await fetch("/api/auth/session", { cache: "no-store" })
        .then((res) => res.json())
        .catch(() => null);
      fetch("http://127.0.0.1:7668/ingest/f4aec2f7-622b-445a-95fa-99041b9558b2", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "379971" },
        body: JSON.stringify({
          sessionId: "379971",
          runId: "auth-client-callback-v4",
          hypothesisId: "H4",
          location: "auth/callback/page:complete",
          message: "client exchange complete",
          data: {
            hasUser: Boolean(data.user),
            serverAuthenticated: Boolean(probe?.authenticated),
            authCookieCount: probe?.authCookieCount ?? 0,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      router.replace(next);
      router.refresh();
    }

    void completeSignIn().catch(() => {
      setMessage("Sign-in failed. Redirecting…");
      router.replace("/login?error=oauth_exchange_failed");
    });
  }, [params, router]);

  return (
    <main className="mx-auto flex min-h-[50vh] max-w-md items-center justify-center px-6 py-16">
      <p className="text-sm text-muted-foreground">{message}</p>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-[50vh] max-w-md items-center justify-center px-6 py-16">
          <p className="text-sm text-muted-foreground">Completing sign-in…</p>
        </main>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
