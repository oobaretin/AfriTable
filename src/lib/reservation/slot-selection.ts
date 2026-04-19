export type SlotLike = {
  time: string;
  status: "available" | "limited" | "unavailable";
  availableTables: number;
};

export function isSlotSelectable(s: SlotLike): boolean {
  return s.status !== "unavailable" && s.availableTables > 0;
}

/**
 * Pick a bookable slot for a requested HH:mm: exact match, else next at/after, else latest before, else first selectable.
 */
export function pickNearestSelectableSlot(requestedTime: string | null | undefined, slots: SlotLike[]): SlotLike | null {
  if (!requestedTime || !slots.length) return null;
  const selectable = slots.filter(isSlotSelectable);
  if (!selectable.length) return null;
  const exact = selectable.find((s) => s.time === requestedTime);
  if (exact) return exact;
  const atOrAfter = selectable.find((s) => s.time >= requestedTime);
  if (atOrAfter) return atOrAfter;
  const before = [...selectable].reverse().find((s) => s.time < requestedTime);
  return before ?? selectable[0];
}
