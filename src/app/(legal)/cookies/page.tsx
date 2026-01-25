export const metadata = {
  title: "Cookie Policy",
};

export default function CookiesPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Cookie Policy</h1>
      <p className="mt-4 text-muted-foreground">
        AfriTable uses cookies to keep you signed in, remember preferences, and measure performance. This is placeholder text for MVP—replace with
        final legal copy before launch.
      </p>
      <div className="prose mt-8 max-w-none">
        <h2>Essential cookies</h2>
        <p>Required for authentication and security.</p>
        <h2>Analytics cookies</h2>
        <p>Help us understand usage and improve performance. You can opt out via your browser settings.</p>
      </div>
    </main>
  );
}

