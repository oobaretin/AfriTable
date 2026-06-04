"use client";

import Link from "next/link";

const faqItems = [
  {
    question: "Apply to partner vs. create owner account?",
    answer:
      "Apply to partner if you are exploring AfriTable for the first time. We review every application and email you an onboarding link if approved. Create an owner account only after you have been approved or received a claim/invite link.",
  },
  {
    question: "Suggest a listing vs. apply to partner?",
    answer:
      "Suggest a listing when you want to tell us about a restaurant that should be in the directory—you do not need to be the owner. Apply to partner when you represent the restaurant and want to manage reservations and your listing on AfriTable.",
  },
  {
    question: "What happens after I apply?",
    answer:
      "Our partnerships team reviews your application within 2–3 business days. If approved, you receive an email with a secure link to create your owner account and complete onboarding.",
  },
  {
    question: "Already have an owner account?",
    answer: (
      <>
        Sign in at{" "}
        <Link href="/login?redirectTo=/dashboard" className="font-medium text-primary underline-offset-4 hover:underline">
          Owner login
        </Link>{" "}
        to open your dashboard, or visit{" "}
        <Link href="/owner/onboarding" className="font-medium text-primary underline-offset-4 hover:underline">
          owner onboarding
        </Link>{" "}
        if you still need to finish setup.
      </>
    ),
  },
] as const;

export function PartnerSignupFAQ() {
  return (
    <div className="mt-10 rounded-2xl border bg-muted/30 p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Common questions</h3>
      <dl className="mt-4 space-y-5">
        {faqItems.map((item) => (
          <div key={item.question}>
            <dt className="text-sm font-semibold text-foreground">{item.question}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
