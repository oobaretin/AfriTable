export const metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="mt-4 text-muted-foreground">
        These Terms govern your use of AfriTable. This is placeholder text for MVP—replace with final legal copy before launch.
      </p>
      <div className="prose prose-invert mt-8 max-w-none">
        <h2>Reservations</h2>
        <p>
          AfriTable facilitates reservations between diners and restaurants. Restaurants are responsible for honoring reservations and maintaining
          accurate availability.
        </p>
        <h2>Cancellation policy</h2>
        <p>Unless otherwise stated, cancellations are free up to 2 hours before the reservation time.</p>
        <h2>Accounts</h2>
        <p>You are responsible for maintaining the security of your account and providing accurate information.</p>
      </div>
    </main>
  );
}

