"use client";

import * as React from "react";

const LivePartnerSlugsContext = React.createContext<ReadonlySet<string>>(new Set());

export function LivePartnerSlugsProvider({
  slugs,
  children,
}: {
  slugs: string[];
  children: React.ReactNode;
}) {
  const value = React.useMemo(() => new Set(slugs), [slugs]);
  return (
    <LivePartnerSlugsContext.Provider value={value}>{children}</LivePartnerSlugsContext.Provider>
  );
}

export function useLivePartnerSlugs(): ReadonlySet<string> {
  return React.useContext(LivePartnerSlugsContext);
}

export function isLivePartnerSlug(slug: string | null | undefined, set: ReadonlySet<string>): boolean {
  if (!slug) return false;
  return set.has(slug);
}
