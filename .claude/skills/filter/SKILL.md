---
name: filter
description: Filter jobs in jobs.json against the candidate profile. Process batches, save progress to disk, ask continue/stop.
argument-hint: "[optional: minimum score threshold, default 3.5]"
---

Before running:
- read `AGENTS.md`
- check first-run readiness
- if `resume.md`, `profile.md`, `jobs.json`, or base files in `data/` are missing, follow `instructions/onboarding.md`
- if `jobs.json` is empty, suggest `/scan`

Read:
- `profile.md`
- `resume.md`
- `instructions/filter.md`
- `data/filter-progress.json`
- `jobs.json`
- `data/filter-results.md`

Threshold: argument if provided, otherwise 3.5.

Follow `instructions/filter.md`.
Use the preferred output language from `profile.md`.
Save progress after every job.
Run `npm run links` after writing filter results.
After the batch, ask `continue` or `stop`.
