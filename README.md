# Brainmoto Learning Skills Check-Up

This repository contains the implementation scaffold for the Brainmoto Learning Skills Check-Up app.

Current scope:
- Next.js app-router structure
- Question/scoring/report/email module placeholders
- Environment scaffolding
- Basic testing scaffold with Vitest

## 1. Prerequisites

- Node.js 20+
- npm 10+
- A PostgreSQL/Neon database
- Resend API key (for later email task)
- Vercel Blob token (for later PDF/storage task)

## 2. Setup

1. Install dependencies:

```bash
npm install
```

2. Create local environment file:

```bash
cp .env.example .env.local
```

3. Fill `.env.local` with real values.

4. Start the app:

```bash
npm run dev
```

5. Open `http://localhost:3000`.

## 3. Database migration and seed

1. Generate Prisma client:

```bash
npm run prisma:generate
```

2. Run first migration:

```bash
npm run prisma:migrate -- --name init_checkup_schema
```

3. Seed initial link data (1 D2C + 2 school links):

```bash
npm run seed
```

## 4. Test commands

```bash
npm run test:unit
npm run test:api
npm run test:e2e
```

Notes:
- `test:unit` and `test:api` run through Vitest.
- `test:e2e` is currently a placeholder script; Playwright e2e implementation is planned for Task 10.x.

## 5. Project notes

- Product rules are defined in `tasks/001-prd-learning-skills-checkup.md`.
- Build sequence is tracked in `tasks/tasks-learning-skills-checkup.md`.
- Gate checks are defined in `tasks/test-gates-learning-skills-checkup.md`.
- Execution journal is tracked in `tasks/execution-log-learning-skills-checkup.md`.

## 6. PDF troubleshooting (local)

- If `/api/report/pdf/[token]` returns:
  - `Vercel Blob: This store does not exist`
- Then:
  1. In Vercel, create/connect a Blob store for this project.
  2. Generate a new read-write token for that store.
  3. Put the token in `.env.local` as `BLOB_READ_WRITE_TOKEN=...`.
  4. Restart `npm run dev`.

- If Prisma CLI says `Environment variable not found: DATABASE_URL`:
  1. Prisma reads from `.env` for CLI commands.
  2. Copy your local values from `.env.local` to `.env`.
  3. Re-run Prisma commands.
