## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Authentication and access

The API uses JWT. Every route needs a `Authorization: Bearer <token>` header, except `POST /auth/login`.

Roles:

- **ADMIN** (system owner): creates gyms and their owners (`POST /gyms`), lists and enables/disables gyms, resets owner passwords, and runs the reminders by hand (`POST /reminders/run`).
- **STAFF** (gym owner): manages only the clients of their own gym (`/clients`).

A new owner gets a temporary password, returned once by `POST /gyms`. On first login the owner must change it (`POST /auth/change-password`) before using any other route.

### Setup

Add these variables to `.env`:

```bash
JWT_SECRET=<long random string, required: the API does not start without it>
JWT_EXPIRES_IN=8h
ADMIN_USERNAME=<admin login>
ADMIN_PASSWORD=<admin password>
```

Then apply the migrations and create the admin (the seed is safe to re-run):

```bash
$ npx prisma migrate deploy
$ npx prisma db seed
```

Existing clients and SMS records are moved to a default gym named "Academia padrão" by the `auth_multi_tenant` migration.
