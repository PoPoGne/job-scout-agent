---
description: First-run setup. Creates resume.md, profile.md, .env, jobs.json, scan-config.json, and runtime files in data/.
---

Work from the repository root.

Follow `instructions/onboarding.md`.

Rules:
- ask for the Apify API token first
- ask for information in small groups
- create local private files only after receiving enough information
- save the Apify token only in `.env`
- never print the token in output
- generate LinkedIn search URLs from the user's target roles and locations
- save those URLs in local `scan-config.json`
- when setup is complete, ask whether to start the first scan
- if the user confirms, run `node scan.mjs`
