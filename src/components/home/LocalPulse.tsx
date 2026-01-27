"use client";

import * as React from "react";

interface PulseMessage {
  type: "trending" | "new";
  emoji: string;
  text: string;
  city?: string;
}

interface LocalPulseProps {
  messages: PulseMessage[];
}

export function LocalPulse({ messages }: LocalPulseProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 5000); // Change message every 5 seconds

    return () => clearInterval(interval);
  }, [messages.length]);

  const currentMessage = messages[currentIndex];

  return (
    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-y border-orange-200 py-4 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 text-sm md:text-base">
          <span className="text-2xl animate-pulse">{currentMessage.emoji}</span>
          <p className="flex-1 text-slate-700 font-medium">
            <span className="font-bold text-orange-600">{currentMessage.city && `${currentMessage.city}: `}</span>
            {currentMessage.text}
          </p>
          <div className="hidden md:flex gap-1">
            {messages.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 w-1.5 rounded-full transition-all ${
                  idx === currentIndex ? "bg-orange-600 w-4" : "bg-orange-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
