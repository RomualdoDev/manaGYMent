// Converts a stored Brazilian phone (area code + number, 10 or 11 digits) to E.164, e.g. +5534997467405.
// Returns null for empty or malformed numbers, which older clients may have.
export function toE164(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 || digits.length === 11 ? `+55${digits}` : null;
}
