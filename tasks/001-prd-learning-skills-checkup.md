# 001 PRD — Learning Skills Check-Up

## 1. Overview

Brainmoto Learning Skills Check-Up is a parent-facing web application that allows a parent to complete a structured question set about their child, receive an instant summary on screen, and get a detailed branded report by email.

The system must support two age-based flows:

- **Pre-primary**: Nursery, Jr KG, Sr KG, UKG
- **Primary**: Grade 1 to Grade 5

The system must calculate scores across **8 fixed skill areas**, convert each skill to one of **3 final levels**, and compute one final rolled-up score out of 100.

This product will be used in two ways:

- **D2C flow**: general Brainmoto public link
- **School flow**: school-branded links with school name, school-specific landing content, and allowed grade control

## 2. Product Goal

Create a reliable, parent-friendly, branded digital check-up that:

1. captures structured parent observations
2. computes scores consistently and correctly
3. presents a simple instant result
4. generates a detailed report page that can also become a PDF
5. emails the report link to the parent
6. works for both Brainmoto direct traffic and school-branded traffic

## 3. Core Product Decisions (Locked)

### 3.1 Fixed skill areas

The exact 8 skill names for both Pre-primary and Primary are:

1. Thinking & Problem Solving
2. Attention & Self-Regulation
3. Working Memory
4. Planning Skills (Executive Functions)
5. Posture & Body Management
6. Locomotor & Movement Fluency
7. Coordination & Bilateral Integration
8. Object Control & Visual Tracking

### 3.2 Final levels

The only final level labels to be used across the product are:

- **Doing Well**
- **Still Developing**
- **Requires Support**

No other label language should appear in the app, report, email, or admin dashboard.

### 3.3 Final level score cutoffs

The score cutoffs are:

- **Doing Well**: 70–100
- **Still Developing**: 45–69
- **Requires Support**: 0–44

These cutoffs apply to:

- each skill score
- the final rolled-up score

### 3.4 Answer options

Every question in both flows uses the same 4 answer options:

- Never
- Sometimes
- Often
- Very Often

### 3.5 Scoring rule

Because the questions are written as concern/struggle indicators, the default scoring direction is:

- Never = 3
- Sometimes = 2
- Often = 1
- Very Often = 0

If any future question is positively worded, that question must explicitly define its own scoring instead of assuming the default.

### 3.6 Weighting rule

All 8 skills must carry **equal final weight**, even though some skills have 2 questions and some have 3.

To achieve this, each skill must be scored separately and normalized to 0–100 first.

Formula:

```text
skill_score = round((earned_points / max_points_for_skill) * 100)
final_score = round(sum_of_all_8_skill_scores / 8)
```

### 3.7 Question counts

- **Pre-primary** has 20 questions total
- **Primary** has 20 questions total

The application must store and score them through configuration files, not hardcoded UI logic.

### 3.8 Instant result screen

Immediately after submission, the user must see:

- final rolled-up score
- final level label
- 8 skill level labels
- short interpretation text
- message that the detailed report has been sent by email

The instant result screen should not show all detailed explanatory paragraphs.

### 3.9 Detailed report delivery

The parent must receive a detailed report by email.

For V1, the recommended delivery method is:

- email a **secure report link**
- optionally add PDF attachment later if needed

The detailed report should exist as a full web report page first. PDF generation should be built from that report page after the web version is stable.

### 3.10 Retake policy

Allow one retake per child per email after **30 days**.

Rules:

- maximum one retake in V1
- store original and retake separately
- mark retake number clearly in data
- do not overwrite the earlier result

### 3.11 Link behavior

The application must support:

- `/checkup` for D2C traffic
- `/checkup/[slug]` for school-branded traffic

School slug links must support:

- school branding
- auto-filled school name
- school-specific welcome content
- school-specific grade availability

### 3.12 Branding and logo policy

- School logo support is mandatory in V1 for school-branded links.
- D2C flow must use a Brainmoto default image/logo.

## 4. Target Users

### Primary user

- Parent of a child in Pre-primary or Primary grades

### Secondary users

- Brainmoto internal team
- school leaders using school-branded links
- Brainmoto operations/admin users reviewing submissions

## 5. User Stories

1. As a parent, I want to answer a clear set of questions about my child so that I can understand where my child may need support.
2. As a parent, I want to receive a quick result immediately after finishing so that I feel I got value instantly.
3. As a parent, I want a detailed report by email so that I can review it later and share it if needed.
4. As a school, I want to share a school-branded version of the check-up so that parents feel the experience is linked to the school.
5. As the Brainmoto team, we want the scoring system to be consistent and testable so that reports are reliable.
6. As the Brainmoto team, we want submissions stored cleanly so that we can review, resend, and analyze them later.

## 6. Functional Requirements

### 6.1 Form flow

1. The system must present a landing/check-up page.
2. The system must collect parent details and child details before final submission.
3. The system must collect at least:
   - parent name
   - parent email
   - optional WhatsApp number
   - child name
   - grade
   - school name (auto-filled if from school link)
4. The system must branch to the correct question set based on grade.
5. The system must validate that all required questions are answered.

### 6.2 Question configuration

6. The system must use separate configuration files for Pre-primary and Primary questions.
7. The system must not hardcode question text inside UI components.
8. Each question entry must contain:
   - question id
   - skill id
   - question text
   - answer options
   - point values

### 6.3 Scoring engine

9. The system must calculate a raw score per skill.
10. The system must calculate a normalized score per skill out of 100.
11. The system must convert each skill score to one of the 3 final levels.
12. The system must calculate one final rolled-up score out of 100.
13. The system must convert the final rolled-up score to one of the 3 final levels.
14. The system must treat all 8 skills as equally weighted.

### 6.4 Data storage

15. The system must save each completed submission in the database.
16. The system must save the selected link source (D2C or school slug).
17. The system must save the answers submitted.
18. The system must save the skill-level scores and the final score.
19. The system must store report delivery status.
20. The system must store retake number and previous submission reference when relevant.

### 6.5 Result and report

21. The system must redirect the user to an instant result page after successful submission.
22. The result page must show the final score, final label, and 8 skill labels.
23. The system must generate a full web report page for the submission.
24. The full web report page must be structured so that it can later be converted to PDF.
25. The report must follow Brainmoto branding and be compatible with school-branded variants.

### 6.6 Email delivery

26. The system must email the parent a secure report link after submission.
27. The system must track whether email sending succeeded or failed.
28. The system must support manual resend later from admin tools.

### 6.7 School links

29. The system must resolve the correct school/link configuration from the slug.
30. The system must load school branding and landing content from the slug configuration.
31. The system must auto-fill school name for school links.
32. The system must restrict grade dropdown options based on the school link configuration.

### 6.8 Admin basics

33. The system must provide at least a minimal internal admin view for reviewing submissions in V1.
34. The admin experience must support viewing submission details and delivery status.
35. The admin experience should support report resend in an early follow-up phase if not included in first release.

## 7. Non-Goals (Out of Scope for V1)

The V1 build should **not** include:

- parent login or account creation
- payment collection
- multi-language support
- editable question management from admin
- school self-service admin portal
- counselor comments entered by Brainmoto staff
- advanced analytics dashboards
- PDF attachment optimization for every mail client
- WhatsApp delivery
- AI-generated recommendations

## 8. Design Considerations

1. The app should feel simple, warm, and parent-friendly.
2. The check-up flow should feel short, clear, and not technical.
3. The instant result should feel high-value but not overwhelming.
4. The full report should be visually strong enough to act as the premium deliverable.
5. The report layout should be coded as a web page first, then adapted for print/PDF.
6. The design should allow school-specific branding without changing core layout.

## 9. Technical Considerations

### 9.1 Recommended stack

- Next.js on Vercel
- Neon Postgres
- Prisma ORM
- Vercel Blob for file storage
- Resend for email sending

### 9.2 Architecture principles

1. The database is the source of truth.
2. Scoring logic must live in reusable server-side code.
3. Question sets must live in config files.
4. UI components must only render questions and results; they must not contain business logic.
5. Report content should be assembled from saved result data, not recalculated in the browser.
6. The result page and report page must read from saved submission data using a secure token.

### 9.3 Suggested data entities

- schools
- checkup_links
- submissions
- reports

### 9.4 Testing principle

No stage should be considered complete until the relevant gate in `test-gates-learning-skills-checkup.md` is passed.

## 10. Success Metrics

The feature will be considered successful when:

1. a parent can complete the form without assistance
2. the correct question set loads based on grade
3. scores are calculated correctly and consistently
4. the instant result page displays the correct stored result
5. the detailed report page loads correctly from the saved token
6. the parent receives the report link by email reliably
7. the same submission can be reviewed later by the Brainmoto team
8. school-branded links correctly load branding and school defaults

## 11. Edge Cases

The system must handle:

- missing required answers
- invalid grade selection
- invalid or inactive school slug
- repeated submit clicks
- failed email send after a successful submission save
- PDF generation delay/failure without losing the report page
- retake requests before 30 days
- parent entering the wrong email
- long child names / school names that might affect report layout

## 12. Open Questions

These do not block coding the first scaffold, but should be finalized during build:

1. exact fields to collect beyond the basic form (for example division, city, phone optional vs required)
2. exact wording of the short interpretation message on the instant result page
3. whether V1 should include a simple admin dashboard immediately or just database access plus manual tools
4. whether school links need custom logos from day one or only school name and text first
5. whether the final PDF should be generated immediately on submit in V1 or added after the web report flow is stable
