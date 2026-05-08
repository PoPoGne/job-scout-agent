---
name: scan
description: Scan LinkedIn through Apify and update jobs.json with new positions. Requires completed onboarding and APIFY_TOKEN in .env.
---

Before running:
- read `AGENTS.md`
- check first-run readiness
- if `.env` or `APIFY_TOKEN` is missing, follow `instructions/onboarding.md`
- if `scan-config.json` has no URLs, ask for keywords and locations, generate LinkedIn search URLs, and update it

Run:

```bash
node scan.mjs
```

Show useful compact output.

If the command fails:
- missing `.env` -> ask for the Apify token and save it only in `.env`
- missing scan URLs -> complete onboarding search settings
- failed Apify run -> suggest checking Apify credits/config
- network error -> suggest retrying

If new jobs are found, suggest `/filter`.
