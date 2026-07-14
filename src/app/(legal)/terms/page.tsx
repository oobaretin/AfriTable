import { LegalPage } from "@/components/legal/LegalPage";

export const metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      lastUpdated="July 2025"
      sections={[
        "Introduction",
        "Directory vs partner listings",
        "Accounts",
        "Reservations and table requests",
        "Cancellations",
        "Restaurant partners",
        "Acceptable use",
        "Disclaimers",
        "Changes",
      ]}
    >
      <h2 id="introduction">Introduction</h2>
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your access to and use of AfriTable, including our website,
        applications, and related services (collectively, the &quot;Service&quot;). By using AfriTable, you agree to
        these Terms. If you do not agree, do not use the Service.
      </p>
      <p>
        AfriTable is a discovery platform for African and Caribbean restaurants in the United States. We publish
        restaurant information to help diners find authentic venues and, where available, submit reservation requests or
        book through partner restaurants.
      </p>

      <h2 id="directory-vs-partner-listings">Directory vs partner listings</h2>
      <p>
        Not every restaurant on AfriTable accepts bookings through our platform. Listings are marked as either{" "}
        <strong>Directory listing</strong> or <strong>Partner · live booking</strong>.
      </p>
      <ul>
        <li>
          <strong>Directory listings</strong> are informational. You may submit a table request through AfriTable; we
          forward your contact details and preferred time, but the restaurant confirms availability directly with you
          (typically by phone). AfriTable does not guarantee a table.
        </li>
        <li>
          <strong>Partner listings</strong> are onboarded restaurants that sync availability with AfriTable. Confirmed
          reservations through partners are subject to the restaurant&apos;s operating hours and capacity.
        </li>
      </ul>

      <h2 id="accounts">Accounts</h2>
      <p>You are responsible for your account and the accuracy of information you provide.</p>
      <ul>
        <li>Provide accurate, current contact information when creating an account or submitting a request</li>
        <li>Keep your login credentials secure and notify us of unauthorized access</li>
        <li>Do not impersonate others or use the Service for unlawful purposes</li>
      </ul>

      <h2 id="reservations-and-table-requests">Reservations and table requests</h2>
      <ul>
        <li>Partner reservations are subject to real-time availability and confirmation rules shown at checkout</li>
        <li>Directory table requests are not confirmed bookings until the restaurant accepts them</li>
        <li>Restaurants may modify or decline requests due to capacity, holidays, or operational needs</li>
        <li>Special requests (dietary needs, seating) are forwarded when provided but are not guaranteed</li>
        <li>AfriTable is not the restaurant operator and is not responsible for food quality, service, or pricing</li>
      </ul>

      <h2 id="cancellations">Cancellations</h2>
      <p>Cancellation rules depend on the listing type and the restaurant&apos;s policy.</p>
      <ul>
        <li>Partner reservations may be cancelled through your account where that feature is available</li>
        <li>For directory requests, contact the restaurant directly if your plans change</li>
        <li>Late cancellations or no-shows may affect future requests at a restaurant&apos;s discretion</li>
      </ul>

      <h2 id="restaurant-partners">Restaurant partners</h2>
      <p>
        Restaurants that join AfriTable as partners agree to keep listing information reasonably accurate, honor
        confirmed reservations when possible, and respond to diner inquiries in a professional manner. Partner
        onboarding is subject to review.
      </p>

      <h2 id="acceptable-use">Acceptable use</h2>
      <p>You may not scrape, reverse engineer, or misuse the Service; post false reviews; or interfere with platform
        security or availability.</p>

      <h2 id="disclaimers">Disclaimers</h2>
      <p>
        The Service is provided &quot;as is.&quot; Restaurant hours, menus, photos, and contact details may change
        without notice. AfriTable does not warrant uninterrupted or error-free operation.
      </p>

      <h2 id="changes">Changes</h2>
      <p>
        We may update these Terms from time to time. Continued use after changes are posted constitutes acceptance of
        the revised Terms. See also our{" "}
        <a href="/privacy" className="text-orange-600 hover:underline">
          Privacy Policy
        </a>
        .
      </p>
    </LegalPage>
  );
}
