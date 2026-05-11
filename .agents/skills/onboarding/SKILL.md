---
name: onboarding
description: First-run setup. Creates resume.md, profile.md, jobs.json, scan-config.json, and runtime files in data/.
---

Follow `instructions/onboarding.md`.

Rules:
- ask for information in small groups
- collect JobSpy search keywords, locations, sites, and result limits
- create or update `scan-config.json` with `provider: "jobspy"` and `searches`
- create runtime files in `data/`
- never commit `.env`, private profile files, runtime state, or output
- when complete, ask whether to start the first scan
- if the user confirms, run `node scan.mjs`
