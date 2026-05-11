---
name: filter
description: Filter jobs in jobs.json against the candidate profile. Use a worker subagent for 40-job batches when available, save progress, and summarize all batches.
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
When subagents are available:
- the main agent coordinates only
- spawn one worker subagent for the next 40 unfiltered jobs
- have the worker return filter rows and a micro-summary
- review the worker output for format/profile mistakes
- save progress/results and run `npm run links`
- immediately start the next 40-job worker batch until all jobs are filtered
- finish with an overall summary of all worker micro-summaries

When subagents are not available:
- process one batch of up to 40 locally
- run `npm run links` after writing filter results
- ask `continue` or `stop`
