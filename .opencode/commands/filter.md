---
description: Filter jobs in jobs.json against the candidate profile. Supports subagents when available.
---

Optional argument: `$ARGUMENTS` = minimum score threshold, or `--agent=N` for number of subagents. Default score 3.5, agents 3.

Before acting:
- read `AGENTS.md`
- check first-run readiness
- if `resume.md`, `profile.md`, `jobs.json`, or base files in `data/` are missing, run `instructions/onboarding.md` first
- if `jobs.json` is empty, suggest `/scan`

## Phase 1 - Preparation

Read:
- @profile.md
- @resume.md
- @instructions/filter.md
- @data/filter-progress.json
- @jobs.json
- @data/filter-results.md

Compute jobs to filter:
- `filtered` = array from `data/filter-progress.json`
- `unfiltered` = jobs in `jobs.json` whose `id` is not in `filtered`
- take the first `N x 20` from `unfiltered`
- if the tool supports subagents, split into N chunks of at most 20
- if the tool does not support subagents, process one batch of at most 20

## Phase 2 - Analysis

For every job:
- use `descriptionText`, not `descriptionHtml`
- follow `instructions/filter.md`
- save progress after every job
- do not invent candidate information
- use the user's preferred output language from `profile.md` for notes and summaries

If using subagents, each subagent writes:
- `data/filter-temp-{N}.json`
- `data/filter-results-temp-{N}.md`

## Phase 3 - Merge

Merge temporary results if they exist:
- update `data/filter-progress.json` with `{ "filtered": [...] }`
- append results to `data/filter-results.md`
- delete only temporary files `data/filter-temp-*.json` and `data/filter-results-temp-*.md`

Show:

```text
N PROCEED - N VERIFY - N REJECT - N SKIP
Remaining: X of Y unfiltered jobs
```

If jobs remain, ask `continue` or `stop`.

After writing filter results, run:

```bash
npm run links
```

Tell the user that `output/open-new-compatible-links.bat` opens only newly added compatible job links from this run.
