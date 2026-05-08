---
description: Generate tailored resumes and cover letters for PROCEED jobs. Creates output/[slug]/ with HTML, PDF, and link.txt.
---

Optional argument: `$ARGUMENTS` = specific company slug. If present, generate only that job.

Before acting:
- read `AGENTS.md`
- check first-run readiness
- if `resume.md`, `profile.md`, `jobs.json`, or base files in `data/` are missing, run `instructions/onboarding.md` first
- if `data/filter-results.md` contains no `PROCEED` jobs, suggest `/filter` first

Read:
- @data/filter-results.md
- @data/generation-progress.json
- @jobs.json
- @resume.md
- @profile.md
- @instructions/generate.md
- @templates/resume-template.html
- @templates/cover-template.html
- @data/application-tracker.md

Instructions:
- follow `instructions/generate.md`
- generate user-facing materials in the preferred language from `profile.md`
- if no slug is passed, process at most 20 incomplete `PROCEED` jobs
- save `data/generation-progress.json` immediately after every job
- generate HTML, PDF, and `link.txt` inside `output/[slug]/`
- update `data/application-tracker.md` without duplicating company + role
- do not invent skills or achievements not present in `resume.md`
- after the batch, show how many remain and ask `continue` or `stop`
