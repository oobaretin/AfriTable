import { LegalPage } from "@/components/legal/LegalPage";

export const metadata = {
  title: "Cookie Policy",
};

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      lastUpdated="July 2026"
      sections={["Introduction", "Essential Cookies", "Analytics Cookies", "Managing Cookies"]}
    >
      <h2 id="introduction">Introduction</h2>
      <p>
        AfriTable uses cookies and similar technologies to keep you signed in, remember your preferences, and understand
        how the site is used. This policy explains what we set, why we use it, and how you can control cookies in your
        browser.
      </p>

      <h2 id="essential-cookies">Essential Cookies</h2>
      <p>
        These cookies are required for core features such as authentication, session security, and remembering cookie
        consent choices. Without them, parts of AfriTable may not work correctly.
      </p>

      <h2 id="analytics-cookies">Analytics Cookies</h2>
      <p>
        We use privacy-focused analytics to measure traffic and improve performance—for example, which pages load slowly
        or where diners drop off in the booking flow. Analytics data is aggregated and not sold to third parties.
      </p>

      <h2 id="managing-cookies">Managing Cookies</h2>
      <p>
        You can control or delete cookies through your browser settings. Disabling essential cookies may limit sign-in,
        reservations, and other account features. For privacy questions, see our{" "}
        <a href="/privacy" className="underline underline-offset-2 hover:text-slate-900">
          Privacy Policy
        </a>
        .
      </p>
    </LegalPage>
  );
}
