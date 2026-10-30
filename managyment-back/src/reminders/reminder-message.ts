// Text of the due-date reminder.
// Kept to the GSM-7 alphabet without accents or emoji on purpose: those switch the SMS to UCS-2,
// which fits only 70 characters and roughly doubles the cost. GSM-7 fits 160 characters in one SMS.
const MAX_FIRST_NAME_LENGTH = 30;

function toGsmText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 !,.()/:\-@'?]/g, '');
}

export function buildReminderMessage(fullName: string, dueDate: string): string {
  const firstName = (fullName.trim().split(/\s+/)[0] ?? '').slice(0, MAX_FIRST_NAME_LENGTH);
  const [, month, day] = dueDate.split('-');
  return toGsmText(
    `Ola, ${firstName}! Sua mensalidade da academia vence hoje (${day}/${month}). Evite atrasos e bons treinos!`,
  );
}
