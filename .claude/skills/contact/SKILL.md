---
name: contact
description: Generate a LinkedIn message for a recruiter at a specific company. Use after generating or sending the application.
argument-hint: "[company name or slug]"
---

Before running:
- read `AGENTS.md`
- verify that `resume.md`, `profile.md`, and `jobs.json` exist
- if missing, follow `instructions/onboarding.md`

Argument received: `{{args}}`

1. Search `jobs.json` for a job whose `companyName` or slug matches the argument.
2. Read `resume.md` and `profile.md`.
3. Extract `jobPosterName`, `jobPosterTitle`, and `jobPosterProfileUrl`.
4. Generate a LinkedIn connection message under 300 characters.
5. Generate a longer InMail version under 5 lines.

Rules:
- use the user's preferred output language from `profile.md`
- reference the specific role
- use one real proof point from `resume.md`
- do not invent experience
- show `jobPosterProfileUrl` if available
