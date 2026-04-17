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

## 3. Email setup (Resend)

1. In Resend, create an API key with sending permission.
2. Put that key in `.env.local` as `RESEND_API_KEY`.
3. Verify your sending domain in Resend (for example `mailer.brainmoto.in`).
4. Set `RESEND_FROM_EMAIL` using that verified domain, for example:

```dotenv
RESEND_FROM_EMAIL=Brainmoto <reports@mailer.brainmoto.in>
```

5. Avoid using personal mailbox addresses as sender addresses.

## 4. Database migration and seed

1. Generate Prisma client:

```bash
npm run prisma:generate
```

2. Run migrations:

```bash
npm run prisma:migrate
```

3. Seed initial link data (1 D2C + 2 school links):

```bash
npm run seed
```

4. Seed DB-backed question sets (published baseline v1 for both flows):

```bash
npm run seed:question-sets
```

## 5. Test commands

```bash
npm run test:unit
npm run test:api
npm run test:e2e
```

Notes:
- `test:unit` and `test:api` run through Vitest.
- `test:e2e` runs real Playwright browser journeys for D2C and school-branded flows.
- First-time Playwright setup (one-time):

```bash
npm run test:e2e:install
```

- E2E prerequisites:
  - `.env.local` must have a working `DATABASE_URL`
  - migrations + seed should be run (`npm run prisma:migrate`, `npm run seed`)
  - school slugs from seed must exist (`greenfield-primary-school` is used in tests)

## 6. Bulk school import (CSV)

Use this to add many schools and school links in one run.

1. Prepare CSV using:
   - `scripts/data/schools.sample.csv`
2. Dry-run first:

```bash
npm run schools:import:dry -- --file scripts/data/schools.sample.csv
```

3. Apply import:

```bash
npm run schools:import -- --file scripts/data/schools.sample.csv
```

The script upserts:
- `schools` records
- matching `checkup_links` with `sourceType=SCHOOL`

It also validates:
- slug collisions
- allowed grades values
- non-school link slug conflicts

## 7. Internal submissions export API (for Sheets/ops)

Endpoint:
- `GET /api/internal/submissions/export`

Auth:
- header `x-admin-key: <INTERNAL_ADMIN_KEY>`
- or query param `?key=<INTERNAL_ADMIN_KEY>`

Query params:
- `format=json|csv` (default `json`)
- `limit=<n>` (default `500`, max `5000`)
- `offset=<n>` (default `0`)
- `since=<ISO datetime>` (optional)

Examples:

```bash
curl -sS -H "x-admin-key: <KEY>" "http://localhost:3000/api/internal/submissions/export?format=json&limit=100&offset=0"
curl -sS -H "x-admin-key: <KEY>" "http://localhost:3000/api/internal/submissions/export?format=csv&limit=100" -o submissions.csv
```

Google Apps Script template:
- `scripts/google-apps-script/sync_submissions.gs`
- Paste into Apps Script and set Script Properties as instructed in file comments.
- Script defaults if optional properties are omitted:
  - `BRAINMOTO_SHEET_NAME` defaults to `Submissions`
  - `BRAINMOTO_LIMIT` defaults to `2000` per batch

## 8. DB-backed question sets (draft/publish/versioning)

Internal endpoints (all require `x-admin-key: <INTERNAL_ADMIN_KEY>`):

- `GET /api/internal/question-sets/<flow>`
  - `<flow>` is `preprimary` or `primary`
  - Returns version list, published version, and content snapshot.
- `POST /api/internal/question-sets/<flow>/draft`
  - Creates a new draft version by copying published/latest/default content.
  - Optional body:
    - `copyFromVersionNumber`
    - `notes`
- `PUT /api/internal/question-sets/<flow>/versions/<version>`
  - Updates a draft version.
  - Body requires:
    - `questionConfig`
    - `reportContent`
  - Optional:
    - `notes`
- `POST /api/internal/question-sets/<flow>/versions/<version>/publish`
  - Publishes the version and archives previous published version.

Minimal API workflow example:

```bash
# 1) Create draft
curl -sS -X POST -H "x-admin-key: <KEY>" \
  "http://localhost:3000/api/internal/question-sets/preprimary/draft"

# 2) Fetch draft content (replace version number)
curl -sS -H "x-admin-key: <KEY>" \
  "http://localhost:3000/api/internal/question-sets/preprimary?version=2"

# 3) Update draft by PUT with edited JSON payload
# 4) Publish draft
curl -sS -X POST -H "x-admin-key: <KEY>" \
  "http://localhost:3000/api/internal/question-sets/preprimary/versions/2/publish"
```

Runtime behavior:
- Parent form loads question config from `/api/checkup/config?grade=<grade>`.
- Submission scoring uses published DB config.
- Report narratives use published DB content.
- If DB content is missing/invalid, app falls back safely to code defaults.

## 9. Project notes

- Product rules are defined in `tasks/001-prd-learning-skills-checkup.md`.
- Build sequence is tracked in `tasks/tasks-learning-skills-checkup.md`.
- Gate checks are defined in `tasks/test-gates-learning-skills-checkup.md`.
- Execution journal is tracked in `tasks/execution-log-learning-skills-checkup.md`.

## 10. PDF troubleshooting (local)

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

## 11. Internal admin submissions page (V1 minimal)

1. Set `INTERNAL_ADMIN_KEY` in `.env.local`.
2. Restart the app.
3. Open:
   - `http://localhost:3000/internal/submissions?key=<INTERNAL_ADMIN_KEY>`

What this page provides:
- latest submissions list
- source/context, final score, retake number
- report email and PDF status
- links to result/report/PDF blob
- `Force Resend` button for report email (uses internal admin action path)
