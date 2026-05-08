# Security Policy

## Private Data

This project is designed to keep sensitive data local.

Never commit:

- `.env`
- `resume.md`
- `profile.md`
- `jobs.json`
- `scan-config.json`
- `data/*`
- `output/*`

## Reporting Issues

If you find a security problem, open an issue without including secrets, tokens, resumes, or private job-search data.

If you accidentally commit a token, revoke it immediately in the provider dashboard before cleaning Git history.
