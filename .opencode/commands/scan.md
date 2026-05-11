---
description: Scan jobs through JobSpy and update jobs.json with new positions.
---

Work from the repository root.

Before acting:
- read `AGENTS.md`
- check first-run readiness
- if `resume.md`, `profile.md`, `jobs.json`, `scan-config.json`, or base files in `data/` are missing, run `instructions/onboarding.md` first
- if `scan-config.json` has no `searches`, ask for search keywords, locations, sites, and result limits, then save them
- if JobSpy is not installed, ask the user to run `python -m pip install -r requirements.txt`

When setup is ready, run:

```bash
node scan.mjs
```

Rules:
- show useful compact output
- if the command fails, read the error and explain the real cause
- if Python is missing, ask for a Python executable path and save `JOBSPY_PYTHON` in local `.env`
- if new jobs are found, suggest `/filter`
- do not manually edit `jobs.json` unless explicit repair is needed
