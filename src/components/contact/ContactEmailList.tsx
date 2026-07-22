import { mailto, SITE_CONTACT } from "@/lib/site-contact";

export type ContactEmailEntry = {
  emoji: string;
  label: string;
  email: string;
  href?: string;
};

/** Public inboxes shown on contact pages and footer. */
export const PUBLIC_CONTACT_EMAILS: ContactEmailEntry[] = [
  { emoji: "📧", label: "General inquiries", email: SITE_CONTACT.hello },
  { emoji: "✉️", label: "Contact us", email: SITE_CONTACT.contact },
  { emoji: "🤝", label: "Restaurant partnerships", email: SITE_CONTACT.partners },
  { emoji: "🏪", label: "Partner program", email: SITE_CONTACT.partnerships },
  { emoji: "🛟", label: "Support", email: SITE_CONTACT.support },
  { emoji: "💼", label: "Sales & business", email: SITE_CONTACT.sales },
  { emoji: "🔒", label: "Privacy", email: SITE_CONTACT.privacy, href: "/privacy" },
];

type ContactEmailListProps = {
  className?: string;
  linkClassName?: string;
  labelClassName?: string;
  layout?: "stack" | "grid";
};

export function ContactEmailList({
  className = "",
  linkClassName = "font-bold text-brand-dark transition-colors hover:text-brand-bronze",
  labelClassName = "text-xs font-bold uppercase tracking-widest text-slate-400",
  layout = "stack",
}: ContactEmailListProps) {
  const containerClass =
    layout === "grid" ? "grid gap-6 sm:grid-cols-2" : "space-y-6";

  return (
    <div className={`${containerClass} ${className}`.trim()}>
      {PUBLIC_CONTACT_EMAILS.map((entry) => (
        <div key={entry.email} className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-brand-bronze/10 bg-brand-paper text-xl shadow-sm">
            {entry.emoji}
          </div>
          <div className="min-w-0">
            <p className={labelClassName}>{entry.label}</p>
            <a href={mailto(entry.email)} className={`${linkClassName} break-all`}>
              {entry.email}
            </a>
            {entry.href ? (
              <p className="mt-1 text-xs text-slate-500">
                <a href={entry.href} className="underline underline-offset-2 hover:text-slate-700">
                  Privacy policy
                </a>
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
