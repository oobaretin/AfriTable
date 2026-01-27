import { LegalPage } from "@/components/legal/LegalPage";

export const metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      lastUpdated="January 2024"
      sections={["Introduction", "Data We Collect", "How We Use Data", "Data Retention", "Your Rights"]}
    >
      <h2 id="introduction">Introduction</h2>
      <p>
        This Privacy Policy explains how AfriTable collects and uses personal data. This is placeholder text for MVP—replace with final legal copy
        before launch.
      </p>

      <h2 id="data-we-collect">Data We Collect</h2>
      <p>Account and reservation data (name, email, phone), preferences, and usage analytics.</p>

      <h2 id="how-we-use-data">How We Use Data</h2>
      <p>To provide reservations, confirmations, reminders, review requests, and customer support.</p>

      <h2 id="data-retention">Data Retention</h2>
      <p>We retain data as needed to provide the service and comply with legal obligations.</p>

      <h2 id="your-rights">Your Rights</h2>
      <p>
        You have the right to access, update, or delete your personal information at any time through your account settings or by contacting us.
      </p>
    </LegalPage>
  );
}

