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
        These Terms of Service (&quot;Terms&quot;) govern your use of AfriTable, our website, mobile application, and related services (collectively, the &quot;Service&quot;). By accessing or using AfriTable, you agree to be bound by these Terms. If you disagree with any part of these Terms, you may not access the Service.
      </p>
      <p>
        This is placeholder text for MVP—replace with final legal copy before launch.
      </p>

      <h2 id="account-security">Account Security</h2>
      <p>You are responsible for maintaining the security of your account and providing accurate information.</p>
      <ul>
        <li>You must provide accurate, current, and complete information when creating an account</li>
        <li>You are responsible for safeguarding your password and account credentials</li>
        <li>You must notify us immediately of any unauthorized use of your account</li>
        <li>You may not share your account with others or use another person&apos;s account</li>
      </ul>

      <h2 id="bookings">Bookings</h2>
      <p>
        AfriTable facilitates reservations between diners and restaurants. Restaurants are responsible for honoring reservations and maintaining
        accurate availability.
      </p>
      <ul>
        <li>Reservations are subject to restaurant availability and confirmation</li>
        <li>Restaurants reserve the right to modify or cancel reservations due to unforeseen circumstances</li>
        <li>We are not responsible for the quality of service, food, or any disputes between diners and restaurants</li>
        <li>Special requests (dietary restrictions, seating preferences) are not guaranteed</li>
      </ul>

      <h2 id="cancellations">Cancellations</h2>
      <p>Unless otherwise stated, cancellations are free up to 2 hours before the reservation time.</p>
      <ul>
        <li>You may cancel your reservation through your account or by contacting the restaurant directly</li>
        <li>Late cancellations or no-shows may result in fees as determined by the restaurant</li>
        <li>Restaurants may have their own cancellation policies that supersede our default policy</li>
        <li>Refunds, if applicable, will be processed according to the restaurant&apos;s policy</li>
      </ul>

      <h2 id="data-usage">Data Usage</h2>
      <p>
        We use your data to provide reservation services, send confirmations and reminders, and improve our platform. We never sell your personal information.
      </p>
      <ul>
        <li>We collect and process data necessary to provide our services</li>
        <li>Your reservation history and preferences help us personalize your experience</li>
        <li>We may use aggregated, anonymized data for analytics and platform improvement</li>
        <li>For more details, please review our <a href="/privacy" className="text-orange-600 hover:underline">Privacy Policy</a></li>
      </ul>
    </LegalPage>
  );
}

