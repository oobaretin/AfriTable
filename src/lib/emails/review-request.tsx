import * as React from "react";
import { Body, Container, Head, Heading, Html, Preview, Section, Text, Button } from "@react-email/components";

export function ReviewRequestEmail(props: {
  appBaseUrl: string;
  restaurantName: string;
  reservationId: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>How was your experience? — AfriTable</Preview>
      <Body style={{ backgroundColor: "#0b0f0d", padding: "24px 12px" }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", backgroundColor: "#0f1412", borderRadius: 16, padding: 24, color: "#fff" }}>
          <Heading style={{ margin: "0 0 12px" }}>How was your experience at {props.restaurantName}?</Heading>
          <Text style={{ margin: "0 0 12px", color: "rgba(255,255,255,0.82)" }}>
            Your review helps other diners discover great African & Caribbean spots.
          </Text>
          <Section style={{ textAlign: "center" as const, marginTop: 14 }}>
            <Button href={`${props.appBaseUrl}/reviews/new/${props.reservationId}`} style={{ backgroundColor: "#22c55e", color: "#05210f", padding: "12px 18px", borderRadius: 999, fontWeight: 700, textDecoration: "none" }}>
              Leave a review
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

