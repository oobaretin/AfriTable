"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
};

export function Reveal({ children, className }: RevealProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "motion-safe:transition motion-safe:duration-700",
        visible
          ? "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3"
          : "opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

