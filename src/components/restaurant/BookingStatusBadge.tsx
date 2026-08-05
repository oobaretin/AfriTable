import { Badge } from "@/components/ui/badge";
import type { BookingAction, BookingMode } from "@/lib/booking-action";
import { cn } from "@/lib/utils";

const MODE_STYLES: Record<BookingMode, string> = {
  book: "border-brand-forest/30 bg-brand-forest/10 text-brand-forest",
  request: "border-brand-bronze/30 bg-brand-bronze/10 text-brand-bronze",
  call: "border-slate-300 bg-slate-100 text-slate-700",
};

export function BookingStatusBadge({
  action,
  className,
  size = "default",
}: {
  action: BookingAction;
  className?: string;
  size?: "default" | "sm";
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-semibold",
        MODE_STYLES[action.mode],
        size === "sm" && "text-[10px] px-2 py-0.5",
        className,
      )}
    >
      {size === "sm" ? action.shortLabel : action.label}
    </Badge>
  );
}
