import { buildReminderMessage } from './reminder-message';

describe('buildReminderMessage', () => {
  it('greets with the first name and the due day and month', () => {
    expect(buildReminderMessage('Ana Souza', '2026-11-10')).toBe(
      'Ola, Ana! Sua mensalidade da academia vence hoje (10/11). Evite atrasos e bons treinos!',
    );
  });

  it('removes accents and keeps only GSM-7 characters', () => {
    const message = buildReminderMessage('João Conceição 🏋️', '2026-11-10');
    expect(message).toMatch(/^Ola, Joao! /);
    expect(message).toMatch(/^[A-Za-z0-9 !,.()/:\-@'?]+$/);
  });

  it('fits in one SMS (160 characters) even with a very long first name', () => {
    const message = buildReminderMessage('Maximiliano'.repeat(10) + ' Silva', '2026-11-10');
    expect(message.length).toBeLessThanOrEqual(160);
  });
});
