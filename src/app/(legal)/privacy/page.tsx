export const metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-4 text-muted-foreground">
        This Privacy Policy explains how AfriTable collects and uses personal data. This is placeholder text for MVP—replace with final legal copy
        before launch.
      </p>
      <div className="prose prose-invert mt-8 max-w-none">
        <h2>Data we collect</h2>
        <p>Account and reservation data (name, email, phone), preferences, and usage analytics.</p>
        <h2>How we use data</h2>
        <p>To provide reservations, confirmations, reminders, review requests, and customer support.</p>
        <h2>Data retention</h2>
        <p>We retain data as needed to provide the service and comply with legal obligations.</p>
      </div>
    </main>
  );
}

