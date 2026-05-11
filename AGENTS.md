# AGENTS.md - job-scout-agent

Generic AI-agent instructions for Codex, OpenCode, Claude Code, and similar coding agents.

This repository is a reusable English-first template. It starts without private user data and guides each new user through setup before scanning jobs, filtering roles, or generating applications.

The project adapts generated application materials to the user's desired language. The repository instructions and file contracts remain in English.

## Primary Rule

Before running any workflow command, check first-run readiness:

1. `resume.md` exists and contains real candidate information.
2. `profile.md` exists and contains target roles, locations, constraints, scoring preferences, and preferred output language.
3. `jobs.json` exists and is a JSON array.
4. `scan-config.json` exists, uses `provider: "jobspy"`, and contains at least one search.
5. `data/filter-progress.json`, `data/generation-progress.json`, `data/output-links-state.json`, `data/applied-jobs.json`, `data/filter-results.md`, and `data/application-tracker.md` exist.

If any required file is missing or still contains example placeholders, stop the requested workflow and run the onboarding process in `instructions/onboarding.md`.

Do not continue to `/scan`, `/filter`, `/generate`, or `/tracker` until onboarding is complete enough for that command.

## First-Run Onboarding

Use `instructions/onboarding.md`.

Ask the user for:

- candidate identity and contact details
- work history, projects, education, certifications, skills, languages
- desired language for generated resumes, cover letters, and summaries
- target roles, locations, remote/hybrid/on-site preferences
- deal breakers, salary expectations, seniority boundaries, language constraints
- JobSpy search keywords, locations, target sites, and scan limits

Create user files from the answers:

- `resume.md`
- `profile.md`
- `jobs.json` as `[]` if no job data exists yet
- `scan-config.json` from `scan-config.example.json`, with user-specific JobSpy searches
- `data/filter-progress.json` as `{ "filtered": [] }`
- `data/generation-progress.json` as `{ "completed": [] }`
- `data/output-links-state.json` as `{ "exported": [] }`
- `data/applied-jobs.json` as `{ "applied": [] }`
- `data/filter-results.md` with an empty heading
- `data/application-tracker.md` with a tracker table header

## Stack

- Node.js ESM
- Playwright for HTML to PDF
- JobSpy scan bridge through `scan.mjs` and `scripts/jobspy-scan.py`

## Scan Provider

JobSpy is the supported scan provider in this template. The default sites are `linkedin`, `indeed`, and `google`.

The AI must:

1. Ask for target roles, locations, desired JobSpy sites, and scan limits.
2. Save those searches in local `scan-config.json`.
3. Ask the user to install Python dependencies with `python -m pip install -r requirements.txt` if JobSpy is not installed.
4. Run `node scan.mjs` when the user confirms the first scan.

For first tests, recommend a low `resultsWanted` such as 10, 25, or 50 per search.

## Key Files

| File | Purpose |
|------|---------|
| `resume.md` | Private candidate source of truth. Ignored by Git. |
| `profile.md` | Private preferences, constraints, language, and scoring notes. Ignored by Git. |
| `.env` | Optional private local environment overrides. Ignored by Git. |
| `jobs.json` | Private scanned jobs. Ignored by Git. |
| `scan-config.example.json` | Public scan config example. |
| `scan-config.json` | Private local scan config created during onboarding. Ignored by Git. |
| `dashboard.mjs` | Builds a static local dashboard in `output/dashboard.html`. |
| `instructions/onboarding.md` | First-run setup workflow. |
| `instructions/filter.md` | Filtering and scoring workflow. |
| `instructions/generate.md` | Resume and cover-letter generation workflow. |
| `templates/*.html` | Resume and cover-letter templates. |
| `data/` | Runtime state. Ignored except docs/placeholders. |
| `output/` | Generated application packages. Ignored except placeholder. |

## Commands

```bash
npm install
node scan.mjs
npm run links
npm run dashboard
npm run applied -- <job-id-or-company-slug>
node generate-pdf.mjs <input.html> <output.pdf> [--format=letter|a4]
npm run pdf
node clean.mjs
```

## Workflow

1. Onboarding: build `resume.md`, `profile.md`, initial state files, and scan settings.
2. `/scan`: run `node scan.mjs` to update `jobs.json`.
3. `/filter`: analyze jobs against `resume.md` and `profile.md`.
4. `npm run links`: export newly compatible links and create `output/open-new-compatible-links.bat`.
5. `/generate`: create tailored resume and cover letter packages for `PROCEED` jobs.
6. `npm run dashboard`: create `output/dashboard.html` with links and PDF downloads.
7. `/tracker`: summarize application status.

OpenCode slash commands live in `.opencode/commands/`.

## Filtering Agent Model

When subagents are available, `/filter` must use a coordinator/worker workflow:

- The main agent is the coordinator.
- The coordinator assigns one worker subagent the next batch of up to 40 unfiltered jobs.
- The worker performs the scoring and returns compact filter rows plus a micro-summary.
- The coordinator reviews the worker output, saves accepted results/progress, runs `npm run links`, and immediately assigns the next 40-job batch.
- The coordinator continues until all jobs are filtered or a blocker occurs.
- At completion, the coordinator gives an overall summary of all worker micro-summaries.

If subagents are not available, process one local batch of up to 40 jobs and ask the user whether to continue.

## Data Contract

`jobs.json` is an array of normalized job objects from JobSpy. Use `descriptionText`, not `descriptionHtml`.

Important fields:

- `id`
- `title`
- `companyName`
- `location`
- `link`
- `seniorityLevel`
- `employmentType`
- `workplaceTypes`
- `workRemoteAllowed`
- `descriptionText`
- `expireAt`
- `postedAt`
- `applicantsCount`
- `salary`
- `jobPosterName`
- `jobPosterTitle`
- `jobPosterProfileUrl`
- `companyWebsite`
- `source`

## Privacy Rules

- Never commit `.env`, `resume.md`, `profile.md`, `jobs.json`, `scan-config.json`, `data/*`, or `output/*`.
- Never hardcode a user's name, email, phone, portfolio, job history, scan URLs, or token into public instructions.
- Never invent skills, experience, certifications, metrics, education, or languages not present in `resume.md`.
- If the user wants to change fit criteria, update `profile.md`, not generic workflow instructions.
- If a command needs a missing secret, ask for it and save it locally, or explain that the command cannot run without it.

## Generation Rules

- Read `resume.md` and `profile.md` before filtering or generating.
- Use `descriptionText`.
- Generate resumes, cover letters, and user-facing summaries in the preferred language from `profile.md`.
- Save progress after each processed job.
- Keep output concise and operational.
- Put every generated application in `output/[slug]/`.
- Do not create flat files directly in `output/`.
- Do not submit applications automatically. Stop before any final external submit action.

## Runtime State

- `data/filter-progress.json`: `{ "filtered": ["id1", "id2"] }`
- `data/generation-progress.json`: `{ "completed": ["id1", "id2"] }`
- `data/output-links-state.json`: `{ "exported": ["id1", "id2"] }`
- `data/applied-jobs.json`: `{ "applied": ["id1", "id2"] }`
- `data/filter-results.md`: cumulative filter log
- `data/application-tracker.md`: one row per company + role; update rows, do not duplicate

## Output Structure

```text
output/[slug]/
  resume-[slug].html
  resume-[slug].pdf
  cover-[slug].html
  cover-[slug].pdf
  link.txt
```

`npm run links` also creates:

```text
output/open-new-compatible-links.bat
output/new-compatible-links.md
output/compatible-links.md
```

`npm run dashboard` creates:

```text
output/dashboard.html
```

## Compatibility Notes

- Codex and OpenCode should read this `AGENTS.md`.
- Claude Code should read `CLAUDE.md`, which points back to this file.
- OpenCode users can run commands from `.opencode/commands/`.
- Agents without slash-command support should follow the same files manually.
