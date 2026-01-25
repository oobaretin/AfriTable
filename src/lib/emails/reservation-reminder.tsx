import * as React from "react";
import { Body, Container, Head, Heading, Html, Preview, Section, Text, Link, Button, Hr } from "@react-email/components";

export function ReservationReminderEmail(props: {
  appBaseUrl: string;
  restaurantName: string;
  reservationId: string;
  date: string;
  time: string;
  partySize: number;
}) {
  return (
    <Html>
      <Head />
      <Preview>Reminder: your reservation is tomorrow — AfriTable</Preview>
      <Body style={{ backgroundColor: "#0b0f0d", padding: "24px 12px" }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", backgroundColor: "#0f1412", borderRadius: 16, padding: 24, color: "#fff" }}>
          <Heading style={{ margin: "0 0 12px" }}>Reminder: your reservation is tomorrow</Heading>
          <Text style={{ margin: "0 0 12px", color: "rgba(255,255,255,0.82)" }}>
            {props.restaurantName} • {props.date} at {props.time} • Party of {props.partySize}
          </Text>
          <Section style={{ textAlign: "center" as const, marginTop: 14 }}>
            <Button href={`${props.appBaseUrl}/reservations/${props.reservationId}/modify`} style={{ backgroundColor: "#f59e0b", color: "#1b1204", padding: "12px 18px", borderRadius: 999, fontWeight: 700, textDecoration: "none" }}>
              Modify reservation
            </Button>
          </Section>
          <Hr style={{ borderColor: "rgba(255,255,255,0.10)", margin: "16px 0" }} />
          <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.62)" }}>
            Need to cancel?{" "}
            <Link href={`${props.appBaseUrl}/reservations/${props.reservationId}/cancel`} style={{ color: "#fb7185" }}>
              Cancel reservation
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

