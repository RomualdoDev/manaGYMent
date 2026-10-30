// Time zone of the gym. Reminders are scheduled and "today" is computed in this zone.
export const ACADEMY_TIME_ZONE = 'America/Sao_Paulo';

// A PENDING reservation older than this is treated as left behind by a crashed run and can be claimed again.
export const STALE_PENDING_MS = 10 * 60 * 1000;
