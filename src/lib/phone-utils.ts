/**
 * Formats a phone number to (XXX) XXX-XXXX format
 * @param phone - Phone number in any format
 * @returns Formatted phone number or original if invalid
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "";
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");
  
  // Must have 10 digits (US phone number)
  if (digits.length !== 10) {
    // Return original if it doesn't match expected format
    return phone;
  }
  
  // Format as (XXX) XXX-XXXX
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/**
 * Normalizes phone number for tel: links (digits only)
 * @param phone - Phone number in any format
 * @returns Digits only for tel: link
 */
export function normalizePhoneForTel(phone: string | null | undefined): string {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
}

/**
 * Validates if a phone number is in the correct format
 * @param phone - Phone number to validate
 * @returns true if valid, false otherwise
 */
export function isValidPhoneFormat(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10;
}
