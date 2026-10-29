// The CPF is stored as digits only; here it is displayed as 000.000.000-00.
export function formatCpf(cpf: string): string {
  return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

// Keeps only the first 11 digits of a CPF and formats them as they are typed: 123.456.789-01.
export function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  let masked = digits.slice(0, 3);
  if (digits.length > 3) masked += `.${digits.slice(3, 6)}`;
  if (digits.length > 6) masked += `.${digits.slice(6, 9)}`;
  if (digits.length > 9) masked += `-${digits.slice(9)}`;
  return masked;
}

// Formats the phone as it is typed: (34) 99746-7405 with 11 digits, (34) 3746-7405 with 10.
export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  const area = digits.slice(0, 2);
  const rest = digits.slice(2);
  const splitAt = rest.length > 8 ? 5 : 4;
  return rest.length > splitAt
    ? `(${area}) ${rest.slice(0, splitAt)}-${rest.slice(splitAt)}`
    : `(${area}) ${rest}`;
}

// The phone is stored as digits only (area code + number); displayed as (34) 99746-7405 or (34) 3746-7405.
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  }
  if (digits.length === 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
  return phone;
}

// Lowercases and strips accents, so "joao" matches "João".
export function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

// Dates come from the API as YYYY-MM-DD and are read as local dates, because the
// DatePipe treats date-only strings as UTC and would show the previous day in Brazil.
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

export function formatDayMonth(isoDate: string): string {
  const [, month, day] = isoDate.split('-');
  return `${day}/${month}`;
}

export function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}
