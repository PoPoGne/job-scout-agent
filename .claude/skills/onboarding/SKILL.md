---
name: onboarding
description: First-run setup. Creates resume.md, profile.md, .env, jobs.json, scan-config.json, and runtime files in data/.
---

Follow `instructions/onboarding.md`.

Rules:
- ask for the Apify API token first
- ask for information in small groups
- save the Apify token only in `.env`
- never print the token
- generate LinkedIn search URLs from the user's roles and locations
- create or update `scan-config.json` with those URLs
- create runtime files in `data/`
- when complete, ask whether to start the first scan
- if the user confirms, run `node scan.mjs`
