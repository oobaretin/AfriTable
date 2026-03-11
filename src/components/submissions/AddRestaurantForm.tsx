"use client";

import React, { useState } from "react";

const CUISINE_OPTIONS = [
  "Nigerian",
  "Ghanaian",
  "Ethiopian",
  "Caribbean",
  "Senegalese",
  "Haitian",
  "Jamaican",
  "Somali",
  "Eritrean",
  "Kenyan",
  "Other",
];

export default function AddRestaurantForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = (formData.get("name") as string)?.trim();
    const address = (formData.get("address") as string)?.trim();
    const city = (formData.get("city") as string)?.trim();
    const state = (formData.get("state") as string)?.trim().toUpperCase().slice(0, 2);
    const cuisine = (formData.get("cuisine") as string)?.trim() || "Other";
    const phone = (formData.get("phone") as string)?.trim() || undefined;
    let website = (formData.get("website") as string)?.trim() || undefined;
    if (website && !/^https?:\/\//i.test(website)) {
      website = `https://${website}`;
    }
    const notes = (formData.get("notes") as string)?.trim() || undefined;
    const submitted_by_email = (formData.get("submitted_by_email") as string)?.trim();

    if (!name || !city || !state || !submitted_by_email) {
      setError("Please fill in required fields: Restaurant name, City, State, and Your email.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/submissions/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          city,
          state,
          cuisine_types: [cuisine],
          address: address || null,
          phone: phone || null,
          website: website || null,
          notes: notes || null,
          submitted_by_email,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || data?.error || "Submission failed. Please try again.");
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
      e.currentTarget.reset();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#000814] text-white pt-24 pb-12 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[#C69C2B] to-white bg-clip-text text-transparent">
          Expand the Table
        </h1>
        <p className="text-white/60 mb-10 font-mono uppercase tracking-widest text-sm">
          Know an authentic spot we missed? Let the diaspora know.
        </p>

        {submitted ? (
          <div className="bg-[#C69C2B]/10 border border-[#C69C2B]/50 p-8 rounded-2xl text-center">
            <h2 className="text-2xl font-bold text-[#C69C2B] mb-2">Submission Received!</h2>
            <p className="text-white/80">
              Our team will verify the details and update the directory soon.
            </p>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="mt-6 text-[#C69C2B] underline uppercase text-sm font-semibold hover:no-underline"
            >
              Add another
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-8 rounded-2xl border border-white/10"
          >
            {error && (
              <div className="md:col-span-2 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
                {error}
              </div>
            )}

            <div className="md:col-span-2">
              <label htmlFor="add-restaurant-name" className="block text-[#C69C2B] text-xs font-mono mb-2 uppercase">
                Restaurant Name
              </label>
              <input
                id="add-restaurant-name"
                name="name"
                type="text"
                required
                className="w-full bg-black/40 border border-white/20 rounded-lg p-3 focus:border-[#C69C2B] outline-none text-white placeholder:text-white/40"
                placeholder="e.g. Suya Spot"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="add-restaurant-address" className="block text-[#C69C2B] text-xs font-mono mb-2 uppercase">
                Full Street Address
              </label>
              <input
                id="add-restaurant-address"
                name="address"
                type="text"
                className="w-full bg-black/40 border border-white/20 rounded-lg p-3 focus:border-[#C69C2B] outline-none text-white placeholder:text-white/40"
                placeholder="123 Flavor Lane, Houston, TX 77002"
              />
            </div>

            <div>
              <label htmlFor="add-restaurant-city" className="block text-[#C69C2B] text-xs font-mono mb-2 uppercase">
                City
              </label>
              <input
                id="add-restaurant-city"
                name="city"
                type="text"
                required
                className="w-full bg-black/40 border border-white/20 rounded-lg p-3 focus:border-[#C69C2B] outline-none text-white placeholder:text-white/40"
                placeholder="e.g. Houston"
              />
            </div>

            <div>
              <label htmlFor="add-restaurant-state" className="block text-[#C69C2B] text-xs font-mono mb-2 uppercase">
                State
              </label>
              <input
                id="add-restaurant-state"
                name="state"
                type="text"
                maxLength={2}
                required
                className="w-full bg-black/40 border border-white/20 rounded-lg p-3 focus:border-[#C69C2B] outline-none text-white placeholder:text-white/40 uppercase"
                placeholder="TX"
              />
            </div>

            <div>
              <label htmlFor="add-restaurant-cuisine" className="block text-[#C69C2B] text-xs font-mono mb-2 uppercase">
                Cuisine Type
              </label>
              <select
                id="add-restaurant-cuisine"
                name="cuisine"
                className="w-full bg-black/40 border border-white/20 rounded-lg p-3 focus:border-[#C69C2B] outline-none text-white appearance-none"
              >
                {CUISINE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="bg-[#000814] text-white">
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="add-restaurant-phone" className="block text-[#C69C2B] text-xs font-mono mb-2 uppercase">
                Phone
              </label>
              <input
                id="add-restaurant-phone"
                name="phone"
                type="tel"
                className="w-full bg-black/40 border border-white/20 rounded-lg p-3 focus:border-[#C69C2B] outline-none text-white placeholder:text-white/40"
                placeholder="(optional)"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="add-restaurant-website" className="block text-[#C69C2B] text-xs font-mono mb-2 uppercase">
                Website or Instagram
              </label>
              <input
                id="add-restaurant-website"
                name="website"
                type="url"
                className="w-full bg-black/40 border border-white/20 rounded-lg p-3 focus:border-[#C69C2B] outline-none text-white placeholder:text-white/40"
                placeholder="https://… (optional)"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="add-restaurant-notes" className="block text-[#C69C2B] text-xs font-mono mb-2 uppercase">
                Anything else we should know?
              </label>
              <textarea
                id="add-restaurant-notes"
                name="notes"
                rows={3}
                className="w-full bg-black/40 border border-white/20 rounded-lg p-3 focus:border-[#C69C2B] outline-none text-white placeholder:text-white/40 resize-none"
                placeholder="Hours, menu link, etc."
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="add-restaurant-email" className="block text-[#C69C2B] text-xs font-mono mb-2 uppercase">
                Your email
              </label>
              <input
                id="add-restaurant-email"
                name="submitted_by_email"
                type="email"
                required
                className="w-full bg-black/40 border border-white/20 rounded-lg p-3 focus:border-[#C69C2B] outline-none text-white placeholder:text-white/40"
                placeholder="you@example.com"
              />
            </div>

            <div className="md:col-span-2 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-[#C69C2B] hover:bg-[#C69C2B]/90 disabled:opacity-50 text-[#000814] font-bold rounded-lg transition-all shadow-lg shadow-[#C69C2B]/20 uppercase tracking-widest"
              >
                {submitting ? "Submitting…" : "Submit for Verification"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
