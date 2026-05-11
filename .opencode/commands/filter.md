---
description: Filter jobs in jobs.json against the candidate profile with a coordinator/worker batch workflow.
---

Optional argument: `$ARGUMENTS` = minimum score threshold. Default score 3.5.

Before acting:
- read `AGENTS.md`
- check first-run readiness
- if `resume.md`, `profile.md`, `jobs.json`, or base files in `data/` are missing, run `instructions/onboarding.md` first
- if `jobs.json` is empty, suggest `/scan`

Read:
- @profile.md
- @resume.md
- @instructions/filter.md
- @data/filter-progress.json
- @jobs.json
- @data/filter-results.md

## Coordinator Workflow

When subagents are available:
- act as the coordinator, not the scorer
- compute unfiltered jobs from `jobs.json` minus `data/filter-progress.json.filtered`
- send one worker subagent the next batch of up to 40 jobs
- instruct the worker to follow `instructions/filter.md`, use `descriptionText`, and return:
  - pre-filter rows
  - analysis rows
  - IDs processed
  - counts by decision
  - micro-summary with strongest `PROCEED`, main rejection/skip reasons, and uncertainties
- review the worker output for obvious format/profile mistakes
- append accepted rows to `data/filter-results.md`
- update `data/filter-progress.json` immediately with processed IDs
- run `npm run links`
- continue with the next 40-job worker batch until no unfiltered jobs remain

At completion:
- run `npm run dashboard`
- give one overall summary of all worker micro-summaries
- report total `PROCEED`, `VERIFY`, `REJECT`, `SKIP`, and remaining jobs

## Fallback

If subagents are not available:
- process one local batch of up to 40 jobs
- save progress after every job
- run `npm run links`
- ask `continue` or `stop`

Rules:
- keep status keywords stable: `PROCEED`, `VERIFY`, `REJECT`, `SKIP`
- do not invent candidate information
- never use `descriptionHtml`
- never overwrite private inputs
