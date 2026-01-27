import { LegalPage } from "@/components/legal/LegalPage";

export const metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      lastUpdated="January 2024"
      sections={["Introduction", "Account Security", "Bookings", "Cancellations", "Data Usage"]}
    >
      <h2 id="introduction">Introduction</h2>
      <p>
        These Terms govern your use of AfriTable. This is placeholder text for MVP—replace with final legal copy before launch.
      </p>

      <h2 id="account-security">Account Security</h2>
      <p>You are responsible for maintaining the security of your account and providing accurate information.</p>

      <h2 id="bookings">Bookings</h2>
      <p>
        AfriTable facilitates reservations between diners and restaurants. Restaurants are responsible for honoring reservations and maintaining
        accurate availability.
      </p>

      <h2 id="cancellations">Cancellations</h2>
      <p>Unless otherwise stated, cancellations are free up to 2 hours before the reservation time.</p>

      <h2 id="data-usage">Data Usage</h2>
      <p>
        We use your data to provide reservation services, send confirmations and reminders, and improve our platform. We never sell your personal information.
      </p>
    </LegalPage>
  );
}

