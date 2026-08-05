"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SITE_CONTACT } from "@/lib/site-contact";
import type {
  PartnerOutreachCandidate,
  PartnerOutreachEmail,
  PartnerOutreachStatusValue,
} from "@/lib/partner-outreach-types";
import {
  PartnerOutreachStatusBadge,
  PartnerOutreachStatusControls,
} from "@/components/admin/PartnerOutreachStatusControls";

type PartnerOutreachPanelProps = {
  candidate: PartnerOutreachCandidate;
  email: PartnerOutreachEmail;
  sendOrder?: number;
  outreachStatus: PartnerOutreachStatusValue;
  outreachNotes: string | null;
  contactedAt: string | null;
  statusUpdatedAt: string | null;
  liveClaimed: boolean;
};

function mailtoCompose(subject: string, body: string, to = ""): string {
  const base = to ? `mailto:${encodeURIComponent(to)}` : "mailto:";
  return `${base}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
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
    <Button type="button" size="sm" variant="outline" onClick={() => void copy()}>
      {copied ? "Copied" : label}
    </Button>
  );
}

function EmailPreview({ label, subject, body }: { label: string; subject: string; body: string }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={subject} label="Copy subject" />
          <CopyButton text={body} label="Copy body" />
          <Button asChild size="sm">
            <a href={mailtoCompose(subject, body)}>Open in email</a>
          </Button>
        </div>
      </div>
      <p className="rounded-lg border bg-muted/20 px-3 py-2 text-sm font-medium">{subject}</p>
      <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border bg-muted/30 p-3 text-xs leading-relaxed">
        {body}
      </pre>
    </div>
  );
}

export function PartnerOutreachCard({
  candidate,
  email,
  sendOrder,
  outreachStatus,
  outreachNotes,
  contactedAt,
  statusUpdatedAt,
  liveClaimed,
}: PartnerOutreachPanelProps) {
  const telHref = candidate.phone ? `tel:${candidate.phone.replace(/[^\d+]/g, "")}` : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {sendOrder != null ? (
              <Badge variant="outline" className="tabular-nums">
                #{sendOrder}
              </Badge>
            ) : null}
            {candidate.priority === "primary" ? <Badge>Primary</Badge> : null}
            <PartnerOutreachStatusBadge status={outreachStatus} />
            <Badge variant="secondary">{candidate.rating.toFixed(1)} ★</Badge>
          </div>
          <CardTitle className="text-lg">{candidate.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {candidate.cuisine} · {candidate.city}, {candidate.state}
          </p>
          <p className="text-xs text-muted-foreground">
            {candidate.phone}
            {candidate.website ? ` · ${candidate.website.replace(/^https?:\/\//, "")}` : ""}
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">Open email template</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{candidate.name}</DialogTitle>
              <DialogDescription>
                Copy or open in your mail client. Send from {SITE_CONTACT.partnerships} after you confirm the
                recipient address.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <div className="rounded-lg border bg-muted/20 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">Suggested first contact</Badge>
                  <span className="text-sm font-medium">{email.channel.label}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {email.channel.kind === "phone" && telHref ? (
                    <Button asChild size="sm">
                      <a href={telHref}>Call {candidate.phone}</a>
                    </Button>
                  ) : (
                    <Button asChild size="sm">
                      <a href={email.channel.href} target="_blank" rel="noreferrer">
                        Open {email.channel.label}
                      </a>
                    </Button>
                  )}
                  {telHref && email.channel.kind !== "phone" ? (
                    <Button asChild size="sm" variant="outline">
                      <a href={telHref}>Call instead</a>
                    </Button>
                  ) : null}
                </div>
              </div>

              <EmailPreview label="Initial outreach" subject={email.subject} body={email.body} />

              <div className="border-t pt-4">
                <EmailPreview
                  label="Follow-up (5 days, no reply)"
                  subject={email.followUp.subject}
                  body={email.followUp.body}
                />
              </div>

              <div className="flex flex-wrap gap-2 border-t pt-4">
                <Button asChild size="sm" variant="outline">
                  <Link href={candidate.detail_url} target="_blank" rel="noreferrer">
                    Public listing
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={candidate.claim_url} target="_blank" rel="noreferrer">
                    Claim page
                  </Link>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Button asChild size="sm" variant="outline">
          <a href={mailtoCompose(email.subject, email.body)}>Quick send</a>
        </Button>
        {telHref ? (
          <Button asChild size="sm" variant="outline">
            <a href={telHref}>Call</a>
          </Button>
        ) : null}
        <Button asChild size="sm" variant="ghost">
          <Link href={candidate.claim_url} target="_blank" rel="noreferrer">
            Claim URL
          </Link>
        </Button>

        <div className="w-full">
          <PartnerOutreachStatusControls
            slug={candidate.slug}
            status={outreachStatus}
            notes={outreachNotes}
            contactedAt={contactedAt}
            updatedAt={statusUpdatedAt}
            liveClaimed={liveClaimed}
          />
        </div>
      </CardContent>
    </Card>
  );
}
