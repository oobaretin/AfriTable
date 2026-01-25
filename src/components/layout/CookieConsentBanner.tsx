"use client";

import CookieConsent from "react-cookie-consent";

export default function CookieConsentBanner() {
  return (
    <CookieConsent
      location="bottom"
      buttonText="Accept"
      cookieName="afritable_cookie_consent"
      style={{ background: "rgba(15, 20, 18, 0.95)", borderTop: "1px solid rgba(255,255,255,0.08)" }}
      buttonStyle={{
        background: "#f59e0b",
        color: "#1b1204",
        fontWeight: 700,
        borderRadius: 999,
        padding: "10px 16px",
      }}
      expires={180}
    >
      This site uses cookies to improve your experience and analyze traffic. You can opt out of non-essential cookies in
      your browser settings.
    </CookieConsent>
  );
}

