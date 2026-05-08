# Contributing

Thanks for wanting to improve `job-scout-agent`.

## Ground Rules

- Keep private user data out of the repository.
- Do not commit `.env`, `resume.md`, `profile.md`, `jobs.json`, `scan-config.json`, `data/*`, or `output/*`.
- Do not add auto-submit behavior. This project is human-in-the-loop by design.
- Do not invent candidate facts in examples or prompts.
- Keep the public template English-first.

## Development

Install dependencies:

```bash
npm install
```

Run syntax checks:

```bash
node --check scan.mjs
node --check clean.mjs
node --check generate-pdf.mjs
node --check sync-output-links.mjs
node --check mark-applied.mjs
```

## Pull Requests

Good pull requests are small and focused. If you change workflow behavior, update:

- `README.md`
- `AGENTS.md`
- `instructions/*`
- relevant `.opencode/commands/*` or skill files

