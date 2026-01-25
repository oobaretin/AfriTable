import * as React from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  right,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 md:flex-row md:items-end md:justify-between", className)}>
      <div>
        <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
        {description ? <p className="mt-2 text-muted-foreground">{description}</p> : null}
      </div>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </div>
  );
}

