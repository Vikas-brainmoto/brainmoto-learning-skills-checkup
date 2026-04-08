# Test Gates — Learning Skills Check-Up

This file defines the minimum checks that must pass before moving to the next major stage.

## How to use this file

1. Complete one meaningful working slice.
2. Run the relevant tests for the current gate.
3. Record results in `execution-log-learning-skills-checkup.md`.
4. Only move ahead when the current gate is passed.

---

## Gate A — Project setup and database readiness

### Goal
Confirm the app runs locally and the database setup is stable.
This gate should be marked passed only after Task 1.0 and Task 2.0 are both complete.

### Must pass

- App starts locally without errors
- Environment variables load correctly
- Prisma client connects to database
- Initial migration runs successfully
- Seed script creates at least:
  - 1 D2C link
  - 2 school links
  - school slug lookup works

### Suggested checks

```bash
npm run dev
npx prisma migrate dev
npm run seed
```

### Manual checks

- Open `/checkup`
- Open `/checkup/<test-school-slug>`
- Confirm no crash
- Confirm branded content changes by slug

### Do not proceed until

- basic app boot is stable
- DB connection is stable
- seed data is usable

---

## Gate B — Scoring engine correctness

### Goal
Confirm that the core scoring logic is mathematically correct before UI polish.

### Must pass

- Pre-primary config loads successfully
- Primary config loads successfully
- Each config has exactly 8 skills
- Each flow has exactly 20 questions
- Score normalization works for 2-question and 3-question skills
- All 8 skills are equally weighted in final score
- Threshold mapping is correct:
  - 44 => Requires Support
  - 45 => Still Developing
  - 69 => Still Developing
  - 70 => Doing Well
- Final rolled-up score uses average of 8 normalized skill scores

### Required unit tests

- all-best-case answers
- all-worst-case answers
- mixed answers across 2-question and 3-question skills
- threshold boundary tests
- invalid skill/question mapping rejection

### Suggested checks

```bash
npm run test:unit
```

### Do not proceed until

- scoring is trustworthy
- boundaries are locked and tested

---

## Gate C — Form flow and submission integrity

### Goal
Confirm the form collects the right data and saves a complete submission correctly.

### Must pass

- Parent details form validates correctly
- Grade controls which question set is shown
- All 20 required questions must be answered
- Invalid payloads are rejected server-side
- Submission saves to database
- Public token is created
- Duplicate rapid submit does not create accidental double results
- Redirect to result page works

### Required tests

- valid Pre-primary submission
- valid Primary submission
- missing answer rejection
- invalid grade rejection
- invalid email rejection
- repeated submit click protection

### Suggested checks

```bash
npm run test:unit
npm run test:api
```

### Manual checks

- Complete one Pre-primary flow in browser
- Complete one Primary flow in browser
- Confirm DB row is created
- Confirm tokenized result link opens

### Do not proceed until

- submissions are saved reliably
- result page uses saved data, not temporary client state

---

## Gate D — Instant result page correctness

### Goal
Confirm the parent sees the correct result immediately after submission.

### Must pass

- Final score shown matches saved result
- Final level label shown matches saved result
- All 8 skill labels shown correctly
- Result page works for both D2C and school-branded flows
- Page handles long child names and long school names gracefully

### Manual checks

- Pre-primary D2C result
- Primary D2C result
- School-branded result
- Mobile-width layout

### Do not proceed until

- the instant result is accurate and readable

---

## Gate E — Full web report correctness

### Goal
Confirm the detailed report page is complete and visually stable before email/PDF.

### Must pass

- Report page loads from token
- Report uses saved submission data only
- Report shows correct branding for school slug flows
- Skill names and level labels match locked product rules
- Layout remains stable with long text values
- Report structure is print-friendly

### Manual checks

- Compare result page vs report page for same token
- Confirm all skills render in correct order
- Confirm no old label language appears
- Confirm no old alias skill names appear in the final UI if removed from the chosen final design

### Do not proceed until

- the web report is visually correct and data-correct

---

## Gate F — Email delivery

### Goal
Confirm report delivery by email works reliably.

### Must pass

- Email sends successfully to a real test inbox
- Email contains the correct secure report link
- Email status is saved in database
- Failed email attempts are marked properly
- Manual resend works for a failed or pending case

### Suggested checks

```bash
npm run test:api
```

### Manual checks

- send to personal test email
- open received email on desktop and mobile
- click report link
- verify correct report opens

### Do not proceed until

- parent can reliably receive the report link

---

## Gate G — PDF generation

### Goal
Confirm PDF is usable, visually acceptable, and linked to the correct report.

### Must pass

- PDF generates from the saved report
- PDF file is stored successfully
- PDF layout is readable and branded
- Page breaks are acceptable
- PDF generation failure does not destroy the report page or submission

### Manual checks

- generate and open PDF for Pre-primary
- generate and open PDF for Primary
- generate and open PDF for school-branded report
- inspect page breaks and margins

### Do not proceed until

- web report and PDF are both stable

---

## Gate H — Retake rules and launch readiness

### Goal
Confirm the application is safe to release for real usage.

### Must pass

- Retake before 30 days is blocked
- Retake after 30 days is allowed
- Retake links to previous submission correctly
- Original result remains unchanged
- End-to-end D2C flow passes
- End-to-end school-branded flow passes
- Environment variables are ready for production

### Suggested checks

```bash
npm run test:unit
npm run test:api
npm run test:e2e
```

### Final launch checklist

- production database connected
- verified sending domain configured
- file storage configured
- seed/admin records prepared
- real school slug tested
- monitoring or error logging connected if available

---

## Recommended test stack

For this project, the simplest good-enough stack is:

- **Vitest** for scoring/unit tests
- **API route tests** using the same test runner
- **Playwright** for end-to-end flow tests

This can be adjusted later, but do not skip Gate B and Gate C tests.
