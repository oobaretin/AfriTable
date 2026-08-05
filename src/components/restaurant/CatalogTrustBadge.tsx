import { Badge } from "@/components/ui/badge";
import type { CatalogTrustSignals } from "@/lib/catalog-trust";
import { cn } from "@/lib/utils";

export function CatalogTrustBadge({
  trust,
  className,
  size = "default",
}: {
  trust: CatalogTrustSignals;
  className?: string;
  size?: "default" | "sm";
}) {
  const vetted = trust.level === "vetted";
  return (
    <Badge
      variant="outline"
      title={
        vetted
          ? "Passed AfriTable dine-in curation with phone, hours, address, and venue photos"
          : "In the AfriTable directory — some details still being strengthened"
      }
      className={cn(
        "font-semibold",
        vetted
          ? "border-brand-forest/30 bg-brand-forest/10 text-brand-forest"
          : "border-slate-300 bg-slate-50 text-slate-600",
        size === "sm" && "text-[10px] px-2 py-0.5",
        className,
      )}
    >
      {size === "sm" ? trust.shortLabel : trust.label}
    </Badge>
  );
}
