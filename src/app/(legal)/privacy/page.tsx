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
        This Privacy Policy explains how AfriTable (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) collects, uses, and protects your personal information when you use our platform. We are committed to protecting your privacy and ensuring transparency about our data practices.
      </p>
      <p>
        This is placeholder text for MVP—replace with final legal copy before launch.
      </p>

      <h2 id="data-we-collect">Data We Collect</h2>
      <p>We collect the following types of information:</p>
      <ul>
        <li><strong>Account Information:</strong> Name, email address, phone number, and password</li>
        <li><strong>Reservation Data:</strong> Restaurant preferences, booking history, special requests, and dietary restrictions</li>
        <li><strong>Usage Analytics:</strong> How you interact with our platform, pages visited, and features used</li>
        <li><strong>Device Information:</strong> IP address, browser type, device type, and operating system</li>
        <li><strong>Location Data:</strong> City-level location information (with your permission) to show nearby restaurants</li>
      </ul>

      <h2 id="how-we-use-data">How We Use Data</h2>
      <p>We use your data for the following purposes:</p>
      <ul>
        <li>To provide and manage your reservations and account</li>
        <li>To send reservation confirmations, reminders, and updates</li>
        <li>To request reviews and feedback after your dining experience</li>
        <li>To provide customer support and respond to inquiries</li>
        <li>To personalize your experience and recommend restaurants</li>
        <li>To improve our platform, analyze usage patterns, and develop new features</li>
        <li>To comply with legal obligations and protect our rights</li>
      </ul>

      <h2 id="data-retention">Data Retention</h2>
      <p>We retain data as needed to provide the service and comply with legal obligations.</p>
      <ul>
        <li>We keep your account information for as long as your account is active</li>
        <li>Reservation history is retained to provide you with booking records and improve recommendations</li>
        <li>We may retain certain data after account deletion as required by law or for legitimate business purposes</li>
        <li>Aggregated, anonymized data may be retained indefinitely for analytics</li>
      </ul>

      <h2 id="your-rights">Your Rights</h2>
      <p>
        You have the following rights regarding your personal information:
      </p>
      <ul>
        <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
        <li><strong>Correction:</strong> Update or correct inaccurate information through your account settings</li>
        <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
        <li><strong>Portability:</strong> Request your data in a portable format</li>
        <li><strong>Opt-out:</strong> Unsubscribe from marketing communications at any time</li>
        <li><strong>Objection:</strong> Object to certain processing activities where applicable</li>
      </ul>
      <p>
        To exercise these rights, please contact us through your account settings or email us at privacy@afritable.com.
      </p>
    </LegalPage>
  );
}

