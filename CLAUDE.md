# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Gym management system ("managyment") with two independent npm projects, no root package.json:

- `managyment-back/` — NestJS 10 API + Prisma 6 on SQLite (`prisma/dev.db` is committed). Listens on port 3000.
- `managyment-front/` — Angular 18 (standalone components, Angular Material) on port 4200. Backend URL is hard-coded in `src/app/api.ts`.

Run all commands from inside the relevant subdirectory.

## Commands

Backend (`managyment-back/`):

```bash
npm run start:dev                 # watch mode
npm run lint                      # eslint --fix
npm run format                    # prettier (singleQuote, trailingComma: all)
npm test                          # unit tests (jest, *.spec.ts under src/)
npx jest src/billing/billing.spec.ts      # single test file
npx jest -t "name of test"               # single test by name
npm run test:e2e                  # e2e (test/*.e2e-spec.ts)
npx prisma migrate dev --name <name>     # new migration after editing schema.prisma
npx prisma migrate deploy && npx prisma db seed   # apply migrations + create admin (seed is idempotent)
```

Required `.env` in `managyment-back/`: `DATABASE_URL`, `JWT_SECRET` (API refuses to start without it), `JWT_EXPIRES_IN` (default 8h), `ADMIN_USERNAME`, `ADMIN_PASSWORD` (used by seed), optional `SMS_PROVIDER` (default `console`; unknown values abort startup).

The e2e suite creates a throwaway SQLite file in `test/`, runs migrations + seed as child processes, and sets its own env vars — it never touches `dev.db`.

Frontend (`managyment-front/`): `npm start` (ng serve), `npm run build`, `npm test` (Karma/Jasmine; single spec via `ng test --include src/app/client.service.spec.ts`).

## Backend architecture

- Imports use the `src/...` absolute path alias (mapped in tsconfig and jest `moduleNameMapper`).
- Global `ValidationPipe` with `whitelist` + `forbidNonWhitelisted` + `transform`: every request body field must be declared on a DTO (class-validator; `brazilian-class-validator` for CPF).
- **Auth is global and deny-by-default.** `AuthModule` registers `AuthGuard` and `RolesGuard` as `APP_GUARD`s. Every route requires a JWT unless decorated `@Public()`. Use `@Roles(ROLE.ADMIN | ROLE.STAFF)` on controllers/handlers, `@CurrentUser()` to get the `AuthUser`, and `@AllowPendingPassword()` for routes usable while `mustChangePassword` is true. `AuthGuard` reloads the user from the DB on every request (deactivation/password changes take effect immediately). Login is rate-limited via `ThrottlerGuard` on that route only.
- **Multi-tenancy:** roles are `ADMIN` (system owner, `gymId` null; manages gyms/owners at `/gyms`, triggers `POST /reminders/run`) and `STAFF` (gym owner; only `/clients`). `Client` has composite PK `(gymId, cpf)` — the same CPF can exist in multiple gyms. Client handlers must always take `gymId` from the token (`user.gymId`), never from request input.
- **Billing** (`src/billing/billing.ts`): pure date functions (no DB). Dates travel as `YYYY-MM-DD` strings, parsed as local dates via `parseDateOnly`. A `billingDay` beyond a month's length falls on the month's last day, so `dueBillingDays` returns multiple days on month-end.
- **Payment reminders:** `PaymentReminderScheduler` runs daily at 09:00 America/Sao_Paulo and calls `PaymentReminderService.sendRemindersFor(todayIn(tz))`. Idempotency is enforced by the `SmsNotification` unique key `(gymId, clientCpf, dueDate)`: a row is reserved as `PENDING` before sending, then set to `SENT`/`FAILED`/`SKIPPED`; `FAILED` and stale `PENDING` rows are reclaimed via an optimistic `updateMany`. Status/role columns are plain strings (SQLite has no enums).
- **SMS** is behind the `SMS_PROVIDER` injection token (`SmsProvider` interface); only `ConsoleSmsProvider` exists. New providers are added to the factory switch in `sms.module.ts`. Phones are normalized with `toE164`.

## Frontend architecture

- `auth.interceptor.ts` attaches the Bearer token only to requests starting with `API_URL` and logs out on 401.
- Route guards in `auth/auth.guards.ts` mirror the backend rules via route `data`: `roles` and `allowPendingPassword`. `homeGuard` sends users to `/change-password`, `/admin`, or `/clients` depending on state/role.

## Conventions

- Code comments are in English; user-facing strings (API error messages, UI text, SMS text) are in Brazilian Portuguese.
- Comments explain *why* (e.g. route ordering like `GET clients/due` declared before `:cpf`).
