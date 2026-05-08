# Filter Jobs - Step 1

## Input

`jobs.json`, `profile.md`, `resume.md`, `data/filter-progress.json`.

## Progress

Read `data/filter-progress.json` with format `{ "filtered": [] }`. Create it if missing.
Skip job IDs already in `filtered`.
Process the next batch of unfiltered jobs.
After every job, add its ID to `filtered` and save immediately.

## Preferred Language

Read `Preferred Output Language` from `profile.md`.
Use that language for user-facing summaries and notes.
Keep status keywords stable in English: `PROCEED`, `VERIFY`, `REJECT`, `SKIP`.

## Pre-Filter

Skip without score when:

- `expireAt < now`
- `postedAt` is older than 30 days
- `employmentType` is Volunteer or Internship, unless the user explicitly wants those
- `seniorityLevel` is Director
- title contains Senior, Lead, Principal, Staff, Manager, Head of, or similar seniority markers and the user does not target those

## Score

Base score: 3.0.

Adapt bonuses and penalties to `profile.md`. The default model:

| Bonus | Points |
|-------|--------|
| target seniority match | +0.5 |
| title contains Junior / Jr / Starter / Entry and user targets junior roles | +0.3 |
| key technologies match `resume.md` and `profile.md` | +0.4 |
| domain or industry match | +0.2 |
| work mode match | +0.3 |
| location match | +0.3 |
| applicant count under 50 | +0.2 |

| Penalty | Points |
|---------|--------|
| seniority above target | -0.5 |
| hard requirement missing from `resume.md` | -0.4 |
| language requirement not met | -0.6 |
| work mode mismatch | -0.3 |
| location mismatch | -0.3 |
| applicant count above 200 | -0.1 |

Reject when:

- mandatory language requirement is not met
- required years of experience clearly exceed candidate profile
- role is centered on a stack the candidate does not have and does not want
- legal/work authorization requirement is incompatible with `profile.md`

Use `descriptionText`, not HTML.

## Decision

- `>= 3.5` -> `PROCEED`
- `3.0-3.4` -> `VERIFY`
- `< 3.0` -> `REJECT`

The threshold may be overridden by the user or by `profile.md`.

## Output

Append to `data/filter-results.md`.

Use compact tables.

Pre-filter rows:

```markdown
| ID | Company | Role | Reason |
```

Analysis rows:

```markdown
| ID | Company | Role | Score | Decision | Tags |
```

Tags should be 2-3 short keywords.

Summary:

```text
N PROCEED - N VERIFY - N REJECT - N SKIP - Total cumulative PROCEED: N
```

## After Batch

Show:

```text
Batch complete. Remaining: X jobs.
Reply continue to process the next batch, or stop to pause.
```

If all jobs are filtered, show:

```text
Filtering complete. Next step: npm run links, then /generate
```

## Output Link Sync

After appending filter results, run:

```bash
npm run links
```

This creates:

- `output/[slug]/link.txt` for newly compatible `PROCEED` jobs
- `output/new-compatible-links.md` for the current run
- `output/compatible-links.md` for all currently compatible non-applied jobs
- `output/open-new-compatible-links.bat` to open only the newly added compatible job links

The script uses `data/output-links-state.json` to avoid reopening jobs already exported in previous runs.
It also skips jobs listed in `data/applied-jobs.json` or whose tracker status in `data/application-tracker.md` indicates they were already applied/submitted/sent/rejected/closed.

After the user applies to a job, mark it as applied:

```bash
npm run applied -- <job-id-or-company-slug>
```
