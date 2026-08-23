export type BookingDrawerRestaurant = {
  /** Slug or UUID — used for availability API and reservation creation */
  id: string;
  slug: string;
  name: string;
  address?: string;
  phone?: string | null;
  image?: string | null;
};

export type BookingDrawerSelection = {
  date: string;
  time: string;
  party: string;
};

export type OpenBookingDrawerOptions = {
  restaurant: BookingDrawerRestaurant;
  selection?: Partial<BookingDrawerSelection>;
  /** Skip date/time picker when selection is complete (e.g. from detail widget) */
  initialStep?: "details" | "guest";
};

export function formatRestaurantAddress(address: unknown): string {
  if (!address) return "";
  if (typeof address === "string") return address;
  const a = address as { street?: string; city?: string; state?: string; zip?: string };
  return [a.street, a.city, a.state, a.zip].filter(Boolean).join(", ");
}
