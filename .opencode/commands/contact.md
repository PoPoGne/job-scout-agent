---
description: Generate a LinkedIn message for the recruiter of a specific company.
---

Optional argument: `$ARGUMENTS` = company name or slug.

Before acting:
- read `AGENTS.md`
- verify that `resume.md`, `profile.md`, and `jobs.json` exist
- if they are missing, run `instructions/onboarding.md` first

Use:
- @jobs.json
- @resume.md
- @profile.md

Find the matching job by company name or slug.

Generate:
- a LinkedIn connection message under 300 characters
- a longer InMail-style version under 5 lines

Rules:
- use the user's preferred output language from `profile.md`
- reference the specific role
- use one real proof point from `resume.md`
- do not invent experience
- show `jobPosterProfileUrl` if available
