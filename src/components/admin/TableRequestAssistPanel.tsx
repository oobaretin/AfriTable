"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { ContactRecommendation } from "@/lib/admin/table-request-assist";

type AssistBundle = {
  contact: ContactRecommendation;
  callScript: string;
  guestConfirmed: { subject: string; body: string };
  guestDeclined: { subject: string; body: string };
};

function mailtoLink(to: string, subject: string, body: string): string {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function CopyBlock({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <Button type="button" size="sm" variant="outline" onClick={() => void copy()}>
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border bg-muted/30 p-3 text-xs leading-relaxed">
        {text}
      </pre>
    </div>
  );
}

export function TableRequestAssistPanel({
  restaurantName,
  guestEmail,
  assist,
}: {
  restaurantName: string;
  guestEmail: string;
  assist: AssistBundle;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          Call prep
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Call prep — {restaurantName}</DialogTitle>
          <DialogDescription>
            Copy the script before you dial. Mark done only after you speak with the restaurant.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Recommended</Badge>
              <span className="text-sm font-medium">{assist.contact.label}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{assist.contact.reason}</p>
            {assist.contact.href ? (
              assist.contact.primary === "phone" ? (
                <Button asChild size="sm" className="mt-3">
                  <a href={assist.contact.href}>Call now</a>
                </Button>
              ) : (
                <Button asChild size="sm" className="mt-3">
                  <a href={assist.contact.href} target="_blank" rel="noreferrer">
                    Open link
                  </a>
                </Button>
              )
            ) : null}
          </div>

          <CopyBlock label="Phone script" text={assist.callScript} />

          <div className="space-y-3 border-t pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              After the call — email guest
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="secondary">
                <a href={mailtoLink(guestEmail, assist.guestConfirmed.subject, assist.guestConfirmed.body)}>
                  Restaurant said yes
                </a>
              </Button>
              <Button asChild size="sm" variant="outline">
                <a href={mailtoLink(guestEmail, assist.guestDeclined.subject, assist.guestDeclined.body)}>
                  Restaurant said no
                </a>
              </Button>
            </div>
            <CopyBlock label="If confirmed (copy)" text={assist.guestConfirmed.body} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
