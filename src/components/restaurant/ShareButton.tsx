"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = React.useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <Button variant="outline" type="button" onClick={() => void share()}>
      {copied ? "Copied" : "Share"}
    </Button>
  );
}

