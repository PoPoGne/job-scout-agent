---
name: tracker
description: Show application status. Reads data/application-tracker.md and data/filter-results.md and produces a summary.
---

Before running:
- read `AGENTS.md`
- if base files in `data/` are missing, create them by following `instructions/onboarding.md`

Read:
- `data/application-tracker.md`
- `data/filter-results.md`, if it exists

Show:
- total jobs analyzed
- how many `PROCEED`, `VERIFY`, `REJECT`
- generated applications in the tracker
- application list with status and available PDFs

If the tracker is empty, suggest `/filter` or `/generate` based on available data.
