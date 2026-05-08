# AGENTS.md - job-scout-agent

Generic AI-agent instructions for Codex, OpenCode, Claude Code, and similar coding agents.

This repository is a reusable English-first template. It starts without private user data and guides each new user through setup before scanning jobs, filtering roles, or generating applications.

The project adapts generated application materials to the user's desired language. The repository instructions and file contracts remain in English.

## Primary Rule

Before running any workflow command, check first-run readiness:

1. `resume.md` exists and contains real candidate information.
2. `profile.md` exists and contains target roles, locations, constraints, scoring preferences, and preferred output language.
3. `.env` exists and contains `APIFY_TOKEN=...`.
4. `jobs.json` exists and is a JSON array.
5. `scan-config.json` exists and contains at least one LinkedIn search URL.
6. `data/filter-progress.json`, `data/generation-progress.json`, `data/output-links-state.json`, `data/applied-jobs.json`, `data/filter-results.md`, and `data/application-tracker.md` exist.

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
- LinkedIn search keywords and locations
- Apify API token for LinkedIn search

When handling the Apify token:

- Explain that it will be saved only in local `.env`.
- Do not print the token back to the user.
- Write `.env` as `APIFY_TOKEN=<token>`.
- Confirm only that the token was saved.
- Never commit `.env`.

Create user files from the answers:

- `resume.md`
- `profile.md`
- `.env`
- `jobs.json` as `[]` if no job data exists yet
- `scan-config.json` from `scan-config.example.json`, with user-specific LinkedIn search URLs
- `data/filter-progress.json` as `{ "filtered": [] }`
- `data/generation-progress.json` as `{ "completed": [] }`
- `data/output-links-state.json` as `{ "exported": [] }`
- `data/applied-jobs.json` as `{ "applied": [] }`
- `data/filter-results.md` with an empty heading
- `data/application-tracker.md` with a tracker table header

## Stack

- Node.js ESM
- Playwright for HTML to PDF
- Apify LinkedIn scraper through `scan.mjs`

## LinkedIn Scan Provider

Apify is the only supported scan provider in this template.

Actor:

```text
https://console.apify.com/actors/hKByXkMQaC5Qt9UMN/input
```

The AI must:

1. Ask for the user's Apify API token at the start of onboarding.
2. Save it only in local `.env`.
3. Ask for target roles and locations.
4. Generate LinkedIn job-search URLs.
5. Save those URLs in local `scan-config.json`.
6. Run `node scan.mjs` when the user confirms the first scan.

For first tests, recommend a low Apify `count` such as 25, 50, or 100 so users can stay within Apify's monthly free usage credit.

## Key Files

| File | Purpose |
|------|---------|
| `resume.md` | Private candidate source of truth. Ignored by Git. |
| `profile.md` | Private preferences, constraints, language, and scoring notes. Ignored by Git. |
| `.env` | Private API token. Ignored by Git. |
| `jobs.json` | Private scanned jobs. Ignored by Git. |
| `scan-config.example.json` | Public scan config example. |
| `scan-config.json` | Private local scan config created during onboarding. Ignored by Git. |
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
npm run applied -- <job-id-or-company-slug>
node generate-pdf.mjs <input.html> <output.pdf> [--format=letter|a4]
npm run pdf
node clean.mjs
```

## Workflow

1. Onboarding: build `resume.md`, `profile.md`, `.env`, initial state files, and scan settings.
2. `/scan`: run `node scan.mjs` to update `jobs.json`.
3. `/filter`: analyze jobs against `resume.md` and `profile.md`.
4. `npm run links`: export newly compatible links and create `output/open-new-compatible-links.bat`.
5. `/generate`: create tailored resume and cover letter packages for `PROCEED` jobs.
6. `/tracker`: summarize application status.

OpenCode slash commands live in `.opencode/commands/`.

## Data Contract

`jobs.json` is an array of LinkedIn job objects. Use `descriptionText`, not `descriptionHtml`.

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

## Compatibility Notes

- Codex and OpenCode should read this `AGENTS.md`.
- Claude Code should read `CLAUDE.md`, which points back to this file.
- OpenCode users can run commands from `.opencode/commands/`.
- Agents without slash-command support should follow the same files manually.
