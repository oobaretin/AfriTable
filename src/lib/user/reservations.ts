import { addHours, isBefore } from "date-fns";

export function canModifyReservation(params: {
  reservationDate: string; // yyyy-mm-dd
  reservationTime: string; // HH:mm
  cutoffHours: number;
}) {
  const { reservationDate, reservationTime, cutoffHours } = params;
  const start = new Date(`${reservationDate}T${reservationTime}:00`);
  return isBefore(addHours(new Date(), cutoffHours), start);
}

