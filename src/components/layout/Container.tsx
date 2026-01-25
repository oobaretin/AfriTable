import * as React from "react";
import { cn } from "@/lib/utils";

export function Container({
  className,
  children,
  as: Comp = "div",
}: {
  className?: string;
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const C: any = Comp;
  return <C className={cn("mx-auto w-full max-w-6xl px-6", className)}>{children}</C>;
}

