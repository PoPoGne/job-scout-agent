---
description: Scan LinkedIn through Apify and update jobs.json with new positions.
---

Work from the repository root.

Before acting:
- read `AGENTS.md`
- check first-run readiness
- if `.env`, `APIFY_TOKEN`, `resume.md`, `profile.md`, `jobs.json`, `scan-config.json`, or base files in `data/` are missing, run `instructions/onboarding.md` first
- if `scan-config.json` has no URLs, ask for search keywords and locations, generate LinkedIn job-search URLs, and save them

When setup is ready, run:

```bash
node scan.mjs
```

Rules:
- show useful compact output
- if `.env` is missing, ask for the Apify token and save it only in `.env`
- never print the token
- if the command fails, read the error and explain the real cause
- if new jobs are found, suggest `/filter`
- do not manually edit `jobs.json` unless explicit repair is needed
