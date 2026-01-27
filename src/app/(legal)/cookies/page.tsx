import { LegalPage } from "@/components/legal/LegalPage";

export const metadata = {
  title: "Cookie Policy",
};

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      lastUpdated="January 2024"
      sections={["Introduction", "Essential Cookies", "Analytics Cookies", "Managing Cookies"]}
    >
      <h2 id="introduction">Introduction</h2>
      <p>
        AfriTable uses cookies to keep you signed in, remember preferences, and measure performance. This is placeholder text for MVP—replace with
        final legal copy before launch.
      </p>

      <h2 id="essential-cookies">Essential Cookies</h2>
      <p>Required for authentication and security.</p>

      <h2 id="analytics-cookies">Analytics Cookies</h2>
      <p>Help us understand usage and improve performance. You can opt out via your browser settings.</p>

      <h2 id="managing-cookies">Managing Cookies</h2>
      <p>
        You can control cookies through your browser settings. Note that disabling essential cookies may affect your ability to use certain features of the platform.
      </p>
    </LegalPage>
  );
}

