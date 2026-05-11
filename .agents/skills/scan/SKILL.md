---
name: scan
description: Scan jobs through JobSpy and update jobs.json with new positions. Requires completed onboarding and scan-config.json.
---

Before running:
- read `AGENTS.md`
- check first-run readiness
- if `resume.md`, `profile.md`, `jobs.json`, `scan-config.json`, or base files in `data/` are missing, follow `instructions/onboarding.md`
- if `scan-config.json` has no `searches`, ask for keywords, locations, sites, and result limits, then update it
- if JobSpy is not installed, ask the user to run `python -m pip install -r requirements.txt`

Run:

```bash
node scan.mjs
```

Show useful compact output.

If the command fails:
- missing JobSpy package -> ask the user to install `requirements.txt`
- missing searches -> complete onboarding search settings
- Python not found -> ask for a Python executable path and save `JOBSPY_PYTHON` in local `.env`
- network or rate-limit error -> suggest retrying with fewer results, fewer sites, or proxies

If new jobs are found, suggest `/filter`.
