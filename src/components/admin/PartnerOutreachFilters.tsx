"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PartnerOutreachFiltersProps = {
  city: string;
  q: string;
};

export function PartnerOutreachFilters({ city, q }: PartnerOutreachFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cityInput, setCityInput] = React.useState(city);
  const [qInput, setQInput] = React.useState(q);

  React.useEffect(() => {
    setCityInput(city);
    setQInput(q);
  }, [city, q]);

  function pushParams(next: { city?: string; q?: string }) {
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete("page");
    if (next.city !== undefined) {
      if (next.city) sp.set("city", next.city);
      else sp.delete("city");
    }
    if (next.q !== undefined) {
      if (next.q) sp.set("q", next.q);
      else sp.delete("q");
    }
    router.push(`/admin/partner-outreach?${sp.toString()}`);
  }

  return (
    <form
      className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        pushParams({ city: cityInput.trim(), q: qInput.trim() });
      }}
    >
      <div className="grid flex-1 gap-1">
        <label htmlFor="outreach-city" className="text-xs font-medium text-muted-foreground">
          City contains
        </label>
        <Input
          id="outreach-city"
          value={cityInput}
          onChange={(e) => setCityInput(e.target.value)}
          placeholder="Houston, Boston, Aurora…"
        />
      </div>
      <div className="grid flex-1 gap-1">
        <label htmlFor="outreach-q" className="text-xs font-medium text-muted-foreground">
          Search name or address
        </label>
        <Input
          id="outreach-q"
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          placeholder="Restaurant name"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm">
          Apply
        </Button>
        {(city || q) && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setCityInput("");
              setQInput("");
              pushParams({ city: "", q: "" });
            }}
          >
            Clear
          </Button>
        )}
      </div>
    </form>
  );
}
