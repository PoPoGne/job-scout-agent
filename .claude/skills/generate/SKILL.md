---
name: generate
description: Generate tailored resumes and cover letters for PROCEED jobs. Creates output/[slug]/ with HTML, PDF, and link.txt.
argument-hint: "[optional: specific company slug]"
---

Before running:
- read `AGENTS.md`
- check first-run readiness
- if `resume.md`, `profile.md`, `jobs.json`, or base files in `data/` are missing, follow `instructions/onboarding.md`
- if no `PROCEED` jobs exist, suggest `/filter`

Read:
- `data/filter-results.md`
- `data/generation-progress.json`
- `jobs.json`
- `resume.md`
- `profile.md`
- `instructions/generate.md`
- `templates/resume-template.html`
- `templates/cover-template.html`
- `data/application-tracker.md`

If an argument is provided, generate only for that slug.

Follow `instructions/generate.md`.
Use the preferred output language from `profile.md`.
Do not invent skills or achievements not present in `resume.md`.
After the batch, ask `continue` or `stop`.
