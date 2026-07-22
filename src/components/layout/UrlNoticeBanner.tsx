"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resolveAuthErrorMessage } from "@/lib/auth/config";

export function UrlNoticeBanner() {
  const params = useSearchParams();
  const router = useRouter();
  const errorCode = params.get("error");
  const text = resolveAuthErrorMessage(errorCode);

  React.useEffect(() => {
    if (!errorCode) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("error");
    router.replace(`${url.pathname}${url.search}`, { scroll: false });
  }, [errorCode, router]);

  if (!text) return null;

  return (
    <div
      role="alert"
      className="border-b border-destructive/30 bg-destructive/10 px-6 py-3 text-center text-sm font-medium text-destructive"
    >
      {text}
    </div>
  );
}
