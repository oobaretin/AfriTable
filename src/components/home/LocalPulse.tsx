"use client";

import * as React from "react";
import Link from "next/link";

interface PulseMessage {
  type: "trending" | "new";
  emoji: string;
  text: string;
  city?: string;
  restaurantId?: string;
}

interface LocalPulseProps {
  messages: PulseMessage[];
}

export function LocalPulse({ messages }: LocalPulseProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    if (messages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [messages.length]);

  const currentMessage = messages[currentIndex];
  const restaurantHref = currentMessage.restaurantId
    ? `/restaurants/${encodeURIComponent(currentMessage.restaurantId)}`
    : null;

  return (
    <div className="border-y border-orange-200/80 bg-gradient-to-r from-orange-50 to-amber-50 py-3 px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3 text-sm md:items-center md:text-base">
          <span className="shrink-0 text-xl md:text-2xl" aria-hidden="true">
            {currentMessage.emoji}
          </span>
          <p className="min-w-0 flex-1 text-slate-700">
            <span className="font-bold text-orange-700">
              {currentMessage.city ? `${currentMessage.city}: ` : ""}
            </span>
            {currentMessage.text}
            {restaurantHref ? (
              <>
                {" "}
                <Link
                  href={restaurantHref}
                  className="font-semibold text-orange-700 underline-offset-4 hover:underline"
                >
                  View listing →
                </Link>
              </>
            ) : null}
          </p>
          {messages.length > 1 ? (
            <div className="hidden shrink-0 gap-1 md:flex" aria-hidden="true">
              {messages.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentIndex ? "w-4 bg-orange-600" : "w-1.5 bg-orange-300"
                  }`}
                />
              ))}
            </div>
          ) : null}
        </div>
        <p
          className="shrink-0 text-[11px] text-slate-500 md:text-xs"
          title="Highlights rotate for inspiration; they are not live booking totals unless labeled otherwise."
        >
          Editorial highlights · not live booking data
        </p>
      </div>
    </div>
  );
}
