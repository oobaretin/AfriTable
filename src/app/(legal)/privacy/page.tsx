import { LegalPage } from "@/components/legal/LegalPage";
import { mailto, SITE_CONTACT } from "@/lib/site-contact";

export const metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      lastUpdated="July 2025"
      sections={[
        "Introduction",
        "Information we collect",
        "How we use information",
        "Sharing",
        "Retention",
        "Your choices",
        "Contact",
      ]}
    >
      <h2 id="introduction">Introduction</h2>
      <p>
        This Privacy Policy describes how AfriTable (&quot;AfriTable,&quot; &quot;we,&quot; or &quot;us&quot;) collects,
        uses, and protects personal information when you use our website and related services. We operate a restaurant
        discovery and booking platform focused on African and Caribbean dining in the United States.
      </p>

      <h2 id="information-we-collect">Information we collect</h2>
      <p>Depending on how you use AfriTable, we may collect:</p>
      <ul>
        <li>
          <strong>Account information:</strong> name, email address, phone number, and authentication identifiers when
          you create an account or sign in (including via third-party providers where enabled)
        </li>
        <li>
          <strong>Reservation and request data:</strong> preferred date, time, party size, special requests, and
          restaurant selection
        </li>
        <li>
          <strong>Communications:</strong> messages you send to support or partner flows (e.g. listing submissions)
        </li>
        <li>
          <strong>Usage data:</strong> pages viewed, searches, device/browser type, and approximate location derived
          from IP or city-level inputs you provide
        </li>
        <li>
          <strong>Reviews and favorites:</strong> ratings, review text, and saved restaurants when you use those
          features while signed in
        </li>
      </ul>

      <h2 id="how-we-use-information">How we use information</h2>
      <ul>
        <li>Provide directory browsing, table requests, and partner reservations</li>
        <li>Send transactional emails (confirmations, request receipts, account notices)</li>
        <li>Operate partner onboarding, listing management, and admin review workflows</li>
        <li>Improve search, recommendations, and platform reliability</li>
        <li>Detect abuse, fraud, and security incidents</li>
        <li>Comply with legal obligations</li>
      </ul>
      <p>We do not sell your personal information.</p>

      <h2 id="sharing">Sharing</h2>
      <p>We share information only as needed to operate the Service:</p>
      <ul>
        <li>
          <strong>Restaurants:</strong> when you submit a table request or reservation, we share relevant contact and
          booking details with that venue
        </li>
        <li>
          <strong>Service providers:</strong> hosting, email delivery, analytics, and authentication vendors that
          process data on our behalf under contractual safeguards
        </li>
        <li>
          <strong>Legal:</strong> when required by law or to protect rights, safety, and integrity of the platform
        </li>
      </ul>

      <h2 id="retention">Retention</h2>
      <p>
        We retain personal information for as long as your account is active or as needed to provide the Service, resolve
        disputes, and meet legal requirements. You may request account deletion subject to applicable law and legitimate
        operational needs (e.g. reservation records).
      </p>

      <h2 id="your-choices">Your choices</h2>
      <ul>
        <li>Update profile information in account settings where available</li>
        <li>Opt out of non-essential marketing emails via unsubscribe links</li>
        <li>Request access, correction, or deletion by contacting us</li>
        <li>Disable cookies through your browser; some features may not work without them</li>
      </ul>

      <h2 id="contact">Contact</h2>
      <p>
        Privacy questions or requests:{" "}
        <a href={mailto(SITE_CONTACT.privacy)} className="underline underline-offset-2 hover:text-slate-900">
          {SITE_CONTACT.privacy}
        </a>
        . See also our{" "}
        <a href="/terms" className="underline underline-offset-2 hover:text-slate-900">
          Terms of Service
        </a>
        .
      </p>
    </LegalPage>
  );
}
