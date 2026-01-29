"use client";

import * as React from "react";
import Link from "next/link";

export function RestaurantOwnerCTA() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-slate-900 py-20 px-8">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 h-96 w-96 rounded-full bg-orange-600/20 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 h-96 w-96 rounded-full bg-yellow-600/10 blur-3xl"></div>

      <div className="relative z-10 mx-auto max-w-5xl">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-center">
          
          {/* Content Side */}
          <div>
            <span className="inline-block px-4 py-1 mb-6 rounded-full bg-orange-500/10 text-orange-500 text-xs font-black uppercase tracking-widest border border-orange-500/20">
              For Restaurant Owners
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
              Bring your flavors to a <span className="text-orange-500">global table.</span>
            </h2>
            <p className="text-lg text-slate-400 mb-8 leading-relaxed">
              Join the premier platform dedicated to African and Caribbean dining. Reach thousands of diners, manage your reservations seamlessly, and grow your brand with tools built for your culture.
            </p>
            
            <div className="space-y-4 mb-10">
              {[
                "Reach 50k+ monthly active diners",
                "0% commission on your first 3 months",
                "Advanced reservation & table management",
                "Direct marketing to the diaspora community"
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-3 text-slate-300">
                  <div className="flex-shrink-0 rounded-full bg-orange-500/20 p-1">
                    <svg className="h-4 w-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <a href="/join-as-restaurant" className="btn-bronze px-8 py-4 rounded-xl font-bold text-white uppercase tracking-widest text-sm text-center pointer-events-auto cursor-pointer">
                Get Started for Free
              </a>
              <a href="/contact" className="inline-flex items-center justify-center rounded-xl bg-white/5 px-8 py-4 font-bold text-white border border-white/10 transition-all hover:bg-white/10 pointer-events-auto cursor-pointer">
                Talk to Sales
              </a>
            </div>
          </div>

          {/* Feature Highlight Cards Side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white/5 p-6 border border-white/10 backdrop-blur-sm">
              <div className="text-3xl mb-4">📈</div>
              <h4 className="text-white font-bold mb-2">Growth</h4>
              <p className="text-xs text-slate-400">Increase your weekend bookings by up to 40%.</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-6 border border-white/10 mt-8 backdrop-blur-sm">
              <div className="text-3xl mb-4">💬</div>
              <h4 className="text-white font-bold mb-2">Feedback</h4>
              <p className="text-xs text-slate-400">Collect verified reviews and build diner loyalty.</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-6 border border-white/10 backdrop-blur-sm">
              <div className="text-3xl mb-4">📱</div>
              <h4 className="text-white font-bold mb-2">Simplicity</h4>
              <p className="text-xs text-slate-400">Manage everything from our intuitive Owner App.</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-6 border border-white/10 mt-8 backdrop-blur-sm">
              <div className="text-3xl mb-4">🌍</div>
              <h4 className="text-white font-bold mb-2">Culture</h4>
              <p className="text-xs text-slate-400">A platform that finally understands your cuisine.</p>
              </div>
          </div>

        </div>
      </div>
    </section>
  );
}
