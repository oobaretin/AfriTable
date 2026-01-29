"use client";

import * as React from "react";
import { Mail } from "lucide-react";

export function Newsletter() {
  const emailInputId = React.useId();
  const [email, setEmail] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          source: "homepage",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Something went wrong. Please try again.");
      }

      setIsSuccess(true);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative w-full bg-[#050A18] py-20 md:py-28 overflow-hidden">
      {/* Subtle background accent */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#C69C2B]/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#A33B32]/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-6">
        {/* Headline */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-5xl font-serif text-[#C69C2B] font-normal mb-4 tracking-tight">
            The Diaspora is on the Menu.
          </h2>
          <p className="text-base md:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
            Be the first to know when we add new cities and exclusive dining guides. No social media noise, just good food.
          </p>
        </div>

        {/* Form */}
        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="mt-10">
            <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
              <div className="flex-1 relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  id={`${emailInputId}-home-newsletter-email`}
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={isSubmitting}
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-[#C69C2B]/50 focus:ring-2 focus:ring-[#C69C2B]/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Enter your email for newsletter"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="px-8 py-4 bg-transparent border border-[#C69C2B] text-[#C69C2B] uppercase tracking-wider font-semibold rounded-lg hover:bg-[#C69C2B]/10 hover:shadow-[0_0_15px_rgba(198,156,43,0.4)] transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:shadow-none whitespace-nowrap"
              >
                {isSubmitting ? "Joining..." : "Join the Waitlist"}
              </button>
            </div>
            {error && (
              <p className="mt-4 text-center text-sm text-red-400/80">
                {error}
              </p>
            )}
          </form>
        ) : (
          /* Success State */
          <div className="mt-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#C69C2B]/20 mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-8 h-8 text-[#C69C2B]"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <p className="text-xl md:text-2xl font-serif text-[#C69C2B] font-normal mb-2">
              Welcome to the family.
            </p>
            <p className="text-base text-white/70">
              Your first city guide is on the way.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
