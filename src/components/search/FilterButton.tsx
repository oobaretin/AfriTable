"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function FilterButton({
  label,
  param,
  value,
}: {
  label: string;
  param: string;
  value: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const apply = React.useCallback(() => {
    const p = new URLSearchParams(params.toString());
    p.set(param, value);
    router.push(`?${p.toString()}`);
  }, [params, param, value, router]);

  return (
    <button
      type="button"
      onClick={apply}
      className="rounded-full border px-4 py-2 text-sm transition hover:bg-muted"
    >
      {label}
    </button>
  );
}

