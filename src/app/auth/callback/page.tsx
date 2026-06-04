"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
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

async function reportAuthEvent(payload: {
  stage: string;
  errorMessage?: string | null;
  hasUser?: boolean;
  clientHasSession?: boolean;
  authCookieCount?: number;
}) {
  try {
    await fetch("/api/auth/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // non-fatal
  }
}

function AuthCallbackInner() {
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
      void reportAuthEvent({ stage: "oauth_provider_error", errorMessage: oauthError });
      window.location.assign(`/login?error=${encodeURIComponent(oauthError)}`);
      return;
    }

    if (!code) {
      void reportAuthEvent({ stage: "missing_code" });
      window.location.assign("/login?error=missing_oauth_code");
      return;
    }

    const authCode = code;

    async function completeSignIn() {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(authCode);

      if (error) {
        await reportAuthEvent({ stage: "exchange_failed", errorMessage: error.message });
        // #region agent log
        fetch("http://127.0.0.1:7668/ingest/f4aec2f7-622b-445a-95fa-99041b9558b2", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "379971" },
          body: JSON.stringify({
            sessionId: "379971",
            runId: "auth-client-callback-v5",
            hypothesisId: "H5",
            location: "auth/callback/page:exchange",
            message: "client exchange failed",
            data: { errorMessage: error.message },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        window.location.assign("/login?error=oauth_exchange_failed");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (data.user) {
        try {
          await supabase.from("profiles").upsert(profilePatchFromUser(data.user), { onConflict: "id" });
        } catch {
          // profile sync is best-effort; auth must still succeed
        }
      }

      const probe = await fetch("/api/auth/session", { cache: "no-store" })
        .then((res) => res.json())
        .catch(() => null);

      await reportAuthEvent({
        stage: "exchange_ok",
        hasUser: Boolean(data.user),
        clientHasSession: Boolean(session),
        authCookieCount: probe?.authCookieCount ?? 0,
      });

      // #region agent log
      fetch("http://127.0.0.1:7668/ingest/f4aec2f7-622b-445a-95fa-99041b9558b2", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "379971" },
        body: JSON.stringify({
          sessionId: "379971",
          runId: "auth-client-callback-v5",
          hypothesisId: "H5",
          location: "auth/callback/page:complete",
          message: "client exchange complete",
          data: {
            hasUser: Boolean(data.user),
            clientHasSession: Boolean(session),
            serverAuthenticated: Boolean(probe?.authenticated),
            authCookieCount: probe?.authCookieCount ?? 0,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      if (!session) {
        setMessage("Sign-in could not be verified. Redirecting…");
        window.location.assign("/login?error=oauth_exchange_failed");
        return;
      }

      window.location.assign(next);
    }

    void completeSignIn().catch(async (err: unknown) => {
      const errorMessage = err instanceof Error ? err.message : "unknown";
      await reportAuthEvent({ stage: "exchange_exception", errorMessage });
      setMessage("Sign-in failed. Redirecting…");
      window.location.assign("/login?error=oauth_exchange_failed");
    });
  }, [params]);

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
