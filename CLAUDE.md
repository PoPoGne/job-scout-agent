# CLAUDE.md - job-scout-agent

Claude Code instructions for this repository.

This project is intentionally model-neutral and English-first. The canonical workflow is in `AGENTS.md`; read and follow it before taking action.

## Claude-Specific Startup

At the start of a new session:

1. Read `AGENTS.md`.
2. Check first-run readiness exactly as described there.
3. If setup is incomplete, follow `instructions/onboarding.md` and collect the missing information from the user.
4. If the user asks for `/scan`, `/filter`, `/generate`, `/tracker`, or `/contact`, run the matching workflow only after onboarding prerequisites are ready.

## Important

- Never print secrets back to the user.
- Save the Apify token only in local `.env`.
- Never commit `.env`, `resume.md`, `profile.md`, `jobs.json`, `scan-config.json`, `data/*`, or `output/*`.
- Do not invent candidate experience. `resume.md` is the source of truth.
- Use `descriptionText`, not `descriptionHtml`.
- Generate user-facing application materials in the preferred language recorded in `profile.md`.
