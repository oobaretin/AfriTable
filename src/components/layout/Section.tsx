import * as React from "react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/layout/Container";

type Spacing = "tight" | "normal" | "loose";

const spacingClasses: Record<Spacing, string> = {
  tight: "py-10 md:py-14",
  normal: "py-14 md:py-20",
  loose: "py-16 md:py-24",
};

export function Section({
  children,
  className,
  spacing = "normal",
  containerClassName,
}: {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  spacing?: Spacing;
}) {
  return (
    <section className={cn(spacingClasses[spacing], className)}>
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}

