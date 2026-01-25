import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type ReservationConfirmationEmailProps = {
  appBaseUrl: string; // e.g. https://afritable.com
  restaurantName: string;
  restaurantAddress: string;
  restaurantPhone?: string | null;
  reservationId: string;
  confirmationCode: string;
  date: string; // yyyy-mm-dd
  time: string; // HH:mm
  partySize: number;
  guestName: string;
  specialRequests?: string | null;
  addToCalendarUrl: string;
};

export function ReservationConfirmationEmail(props: ReservationConfirmationEmailProps) {
  const modifyUrl = `${props.appBaseUrl}/reservations/${props.reservationId}/modify`;
  const cancelUrl = `${props.appBaseUrl}/reservations/${props.reservationId}/cancel`;

  return (
    <Html>
      <Head />
      <Preview>Your reservation is confirmed — AfriTable</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.brandRow}>
            <Img
              alt="AfriTable"
              src="https://via.placeholder.com/120x32.png?text=AfriTable"
              width={120}
              height={32}
              style={styles.logo}
            />
          </Section>

          <Heading style={styles.h1}>Your reservation is confirmed!</Heading>
          <Text style={styles.p}>
            Hi {props.guestName}, we’ve reserved your table at{" "}
            <strong>{props.restaurantName}</strong>.
          </Text>

          <Section style={styles.card}>
            <Text style={styles.cardTitle}>Reservation details</Text>
            <Hr style={styles.hr} />
            <table style={styles.table}>
              <tbody>
                <tr>
                  <td style={styles.tdLabel}>Confirmation</td>
                  <td style={styles.tdValue}>
                    <strong>{props.confirmationCode}</strong>
                  </td>
                </tr>
                <tr>
                  <td style={styles.tdLabel}>Date</td>
                  <td style={styles.tdValue}>{props.date}</td>
                </tr>
                <tr>
                  <td style={styles.tdLabel}>Time</td>
                  <td style={styles.tdValue}>{props.time}</td>
                </tr>
                <tr>
                  <td style={styles.tdLabel}>Party size</td>
                  <td style={styles.tdValue}>{props.partySize}</td>
                </tr>
                {props.specialRequests ? (
                  <tr>
                    <td style={styles.tdLabel}>Requests</td>
                    <td style={styles.tdValue}>{props.specialRequests}</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </Section>

          <Section style={styles.card}>
            <Text style={styles.cardTitle}>Restaurant</Text>
            <Hr style={styles.hr} />
            <Text style={styles.pTight}>
              <strong>{props.restaurantName}</strong>
              <br />
              {props.restaurantAddress}
              {props.restaurantPhone ? (
                <>
                  <br />
                  <Link href={`tel:${props.restaurantPhone}`} style={styles.link}>
                    {props.restaurantPhone}
                  </Link>
                </>
              ) : null}
            </Text>
          </Section>

          <Section style={styles.actions}>
            <Button href={props.addToCalendarUrl} style={styles.primaryButton}>
              Add to Calendar
            </Button>
          </Section>

          <Text style={styles.pSmall}>
            Need to make changes?
            <br />
            <Link href={modifyUrl} style={styles.link}>
              Modify reservation
            </Link>{" "}
            •{" "}
            <Link href={cancelUrl} style={styles.linkDanger}>
              Cancel reservation
            </Link>
          </Text>

          <Hr style={styles.hr} />
          <Text style={styles.footer}>
            AfriTable Support •{" "}
            <Link href={`${props.appBaseUrl}/support`} style={styles.link}>
              Help Center
            </Link>
            <br />
            If you didn’t make this reservation, you can ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: "#0b0f0d",
    margin: 0,
    padding: "24px 12px",
  },
  container: {
    maxWidth: 600,
    margin: "0 auto",
    backgroundColor: "#0f1412",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
    padding: 24,
    color: "#f5f5f5",
  },
  brandRow: { marginBottom: 16 },
  logo: { display: "block" },
  h1: {
    fontSize: 26,
    lineHeight: "32px",
    margin: "0 0 12px",
    color: "#fdfdfd",
  },
  p: { margin: "0 0 14px", color: "rgba(255,255,255,0.82)" },
  pTight: { margin: 0, color: "rgba(255,255,255,0.82)" },
  card: {
    backgroundColor: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
  },
  cardTitle: { margin: 0, fontWeight: 600, color: "#fff" },
  hr: { borderColor: "rgba(255,255,255,0.10)", margin: "12px 0" },
  table: { width: "100%", borderCollapse: "collapse" },
  tdLabel: { width: 160, padding: "6px 0", color: "rgba(255,255,255,0.62)", fontSize: 13 },
  tdValue: { padding: "6px 0", color: "#fff", fontSize: 13 },
  actions: { marginTop: 18, textAlign: "center" as const },
  primaryButton: {
    backgroundColor: "#f59e0b",
    color: "#1b1204",
    borderRadius: 999,
    padding: "12px 18px",
    fontWeight: 700,
    textDecoration: "none",
    display: "inline-block",
  },
  pSmall: { marginTop: 14, fontSize: 13, color: "rgba(255,255,255,0.72)" },
  link: { color: "#fbbf24", textDecoration: "underline" },
  linkDanger: { color: "#fb7185", textDecoration: "underline" },
  footer: { fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 12 },
};

