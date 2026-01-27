"use client";

import * as React from "react";

export function Confetti() {
  const [particles, setParticles] = React.useState<Array<{ id: number; left: number; delay: number; duration: number }>>([]);

  React.useEffect(() => {
    // Generate confetti particles
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 0.5 + Math.random() * 0.5,
    }));
    setParticles(newParticles);

    // Clean up after animation
    const timer = setTimeout(() => {
      setParticles([]);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const colors = ["bg-orange-500", "bg-yellow-500", "bg-orange-600", "bg-yellow-400", "bg-slate-900"];

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const rotation = Math.random() * 360;
        return (
          <div
            key={particle.id}
            className={`absolute w-2 h-2 ${color} rounded-sm`}
            style={{
              left: `${particle.left}%`,
              top: "-10px",
              animation: `confetti-fall ${particle.duration}s ease-out ${particle.delay}s forwards`,
              transform: `rotate(${rotation}deg)`,
            }}
          />
        );
      })}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
