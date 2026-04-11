## Relevant Files

- `.env.example` - Environment variable template for local setup.
- `README.md` - Local setup and test command instructions.
- `package.json` - NPM scripts and dependency scaffolding.
- `tsconfig.json` - TypeScript compiler configuration.
- `next-env.d.ts` - Next.js type references.
- `vitest.config.ts` - Vitest runner configuration.
- `playwright.config.ts` - Playwright E2E runner and local server configuration.
- `.eslintrc.json` - ESLint configuration scaffold.
- `.prettierrc` - Prettier formatting rules.
- `.prettierignore` - Paths ignored by Prettier.
- `.gitignore` - Local and build artifacts ignore rules.
- `public/logo.webp` - Default Brainmoto logo asset for D2C and fallback branding.
- `public/logo-icon.webp` - Public icon asset.
- `app/icon.webp` - App icon used by Next.js.
- `app/layout.tsx` - Root app layout shell.
- `app/page.tsx` - Root landing placeholder.
- `app/globals.css` - Global baseline styles.
- `app/checkup/page.tsx` - D2C check-up page.
- `app/checkup/[slug]/page.tsx` - School-branded check-up page.
- `app/result/[token]/page.tsx` - Instant result screen after submission.
- `app/report/[token]/page.tsx` - Full web report page.
- `app/internal/submissions/page.tsx` - Minimal internal submissions view with report resend action.
- `app/api/submit/route.ts` - Submission API that validates, scores, saves, and returns token.
- `app/api/report/send/[token]/route.ts` - Sends the report email.
- `app/api/report/pdf/[token]/route.ts` - Generates or returns PDF for a report.
- `components/checkup/ChildDetailsForm.tsx` - Parent and child details form.
- `components/checkup/QuestionCard.tsx` - Single question UI.
- `components/checkup/ProgressBar.tsx` - Form progress indicator.
- `components/report/ScoreHero.tsx` - Final score header for result/report pages.
- `components/report/SkillSnapshot.tsx` - 8-skill summary block.
- `components/report/ReportDocument.tsx` - Shared full report document markup used by web and print flows.
- `lib/scoring/config/preprimary.ts` - Pre-primary question and skill config.
- `lib/scoring/config/primary.ts` - Primary question and skill config.
- `lib/scoring/flow.ts` - Grade-to-flow branching helpers.
- `lib/scoring/types.ts` - Shared scoring data types and constants.
- `lib/scoring/engine.ts` - Core scoring calculations.
- `lib/scoring/thresholds.ts` - Score-to-label mapping.
- `lib/db/prisma.ts` - Shared Prisma client singleton for server-side data access.
- `lib/checkup/validation.ts` - Shared client/server check-up payload validation rules.
- `lib/checkup/retake.ts` - Retake eligibility logic (30-day wait, one-retake limit, linkage metadata).
- `lib/links/resolve-link.ts` - Resolves D2C and school link configuration.
- `lib/report/build-report-data.ts` - Builds display data from a saved submission.
- `lib/report/content.ts` - Flow-specific narrative content for Primary and Pre-primary report sections.
- `lib/report/pdf.ts` - PDF generation helper.
- `lib/email/resend.ts` - Email sending helper.
- `prisma/schema.prisma` - Database schema.
- `prisma/migrations/20260407235000_init_checkup_schema/migration.sql` - Initial database migration.
- `prisma/migrations/20260408142634_fix_submission_context_column_names/migration.sql` - Aligns submission context columns to Prisma camelCase fields.
- `prisma/migrations/20260408183500_add_submission_context_fields/migration.sql` - Adds division and housing-society fields to submissions.
- `prisma/migrations/migration_lock.toml` - Prisma migration provider lock.
- `scripts/seed.ts` - Seed data for schools and links.
- `tests/scoring/engine.test.ts` - Unit tests for scoring engine.
- `tests/scoring/flow.test.ts` - Unit tests for grade branching helpers.
- `tests/checkup/validation.test.ts` - Unit tests for details and answer validation.
- `tests/checkup/retake.test.ts` - Unit tests for retake eligibility boundaries and limit checks.
- `tests/report/build-report-data.test.ts` - Unit tests for report data assembly and skill ordering.
- `tests/report/score-hero.test.ts` - Unit tests for score tone color mapping on result/report hero.
- `tests/email/resend.test.ts` - Unit tests for Resend helper success/failure/env handling.
- `tests/api/submit.test.ts` - API tests for submission route.
- `tests/api/report-send.test.ts` - API tests for report email send success and failure paths.
- `tests/api/report-pdf.test.ts` - API tests for report PDF route success and error handling.
- `tests/e2e/checkup-flow.spec.ts` - End-to-end tests for core parent journey.

### Notes

- Keep the question text and scoring data in config files only.
- Do not start PDF generation before the full web report page is correct.
- Treat the database save as the primary success event; email/PDF are follow-up delivery steps.
- School logos are mandatory in V1 for school links; D2C uses a default Brainmoto image/logo.
- Minimal internal admin view is required in V1.
- A4 PDF parity target: Primary report = 5 pages, Pre-primary report = 4 pages (verify via `pdfinfo` on generated PDFs).
- Update this file as new relevant files appear.

## Tasks

- [ ] 1.0 Project setup and base architecture
  - [x] 1.1 Lock the initial stack: Next.js, TypeScript, Tailwind, Prisma, Neon Postgres, Resend, Vercel Blob.
  - [x] 1.2 Create the new app and basic folder structure.
  - [x] 1.3 Add environment variable scaffolding and README setup instructions.
  - [x] 1.4 Add linting, formatting, and a basic testing setup.

- [x] 2.0 Database schema and seed data
  - [x] 2.1 Create Prisma models for schools, checkup_links, submissions, and reports.
  - [x] 2.2 Run the first migration.
  - [x] 2.3 Create seed data for one D2C link and at least two mock school links.
  - [x] 2.4 Test that slug lookup and DB connection work locally.

- [x] 3.0 Question configs and scoring engine
  - [x] 3.1 Create shared scoring types and thresholds.
  - [x] 3.2 Create `preprimary.ts` using the final 20-question Pre-primary set.
  - [x] 3.3 Create `primary.ts` using the final 20-question Primary set.
  - [x] 3.4 Build the scoring engine that normalizes each skill to 0–100 and averages all 8 skills equally.
  - [x] 3.5 Add unit tests for thresholds, normalization, and final score calculation.

- [x] 4.0 Check-up form flow
  - [x] 4.1 Build child and parent details collection UI.
  - [x] 4.2 Build grade-driven branching to the correct question set.
  - [x] 4.3 Build the question rendering UI and progress indicator.
  - [x] 4.4 Add client and server validation.
  - [x] 4.5 Test that all required fields and answers are collected correctly.

- [x] 5.0 Submission API and result page
  - [x] 5.1 Build the submit route.
  - [x] 5.2 Save answers, scores, and source link details to the database.
  - [x] 5.3 Generate a public result token.
  - [x] 5.4 Redirect the user to `/result/[token]`.
  - [x] 5.5 Build the instant result page showing final score, final label, and 8 skill labels.
  - [x] 5.6 Add API tests for the submit flow.

- [x] 6.0 Full web report page
  - [x] 6.1 Build report data assembly helpers from saved submission data.
  - [x] 6.2 Build the full web report page with branded layout.
  - [x] 6.3 Make the report page school-brand aware.
  - [x] 6.4 Test long names, missing optional fields, and different grade bands.

- [x] 7.0 Email delivery
  - [x] 7.1 Create the Resend email helper.
  - [x] 7.2 Build the report-send route.
  - [x] 7.3 Store email send status in the reports table.
  - [x] 7.4 Add resend support for admin/internal use.
  - [x] 7.5 Test successful and failed email cases.

- [x] 8.0 PDF generation
  - [x] 8.1 Build a print-friendly version of the report.
  - [x] 8.2 Generate PDF from the report page.
  - [x] 8.3 Store PDF file location in Vercel Blob.
  - [x] 8.4 Test PDF layout, page breaks, and retry behavior.

- [x] 9.0 Retake rules and admin basics
  - [x] 9.1 Add retake eligibility logic.
  - [x] 9.2 Prevent early retakes.
  - [x] 9.3 Store `retakeNumber` and `previousSubmissionId`.
  - [x] 9.4 Build a minimal internal submissions view or admin action path (required in V1).

- [ ] 10.0 Launch QA and hardening
  - [ ] 10.1 Run all gate checks in `test-gates-learning-skills-checkup.md`.
  - [ ] 10.2 Test D2C flow end to end.
  - [ ] 10.3 Test school-branded flow end to end.
  - [ ] 10.4 Test email and report link delivery.
  - [ ] 10.5 Prepare production environment variables and deployment checklist.
