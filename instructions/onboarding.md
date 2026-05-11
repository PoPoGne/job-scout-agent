# Onboarding - First Run

Use this workflow when the project is empty, when private files are missing, or when example placeholders have not been replaced.

Goal: collect enough information to create local private files so the user can run the complete job-matching pipeline with any AI coding agent.

## Files to Create

- `resume.md`
- `profile.md`
- `jobs.json`
- `scan-config.json`
- `data/filter-progress.json`
- `data/generation-progress.json`
- `data/output-links-state.json`
- `data/applied-jobs.json`
- `data/filter-results.md`
- `data/application-tracker.md`

All of these files are private runtime files and must stay out of Git.

## Conversation Style

Ask in small groups. Do not ask every question at once.

Recommended order:

1. JobSpy scan setup.
2. Identity and contact details.
3. Work history and projects.
4. Education, certifications, skills, languages.
5. Job preferences and constraints.
6. Desired output language.
7. Search settings.
8. Confirm and start the first scan.

If the user already has a resume, ask them to paste it or provide a path. Convert it into `resume.md`.

## Questions to Ask

### 1. JobSpy Scan Setup

This project uses JobSpy as the job-scan provider. It does not require an API token by default.

Ask first:

```text
This project scans jobs with JobSpy. Before the first scan, install the Python dependency with: python -m pip install -r requirements.txt. If Python is not on PATH, tell me the Python executable path and I will save it as JOBSPY_PYTHON in local .env.
```

If the user provides a Python executable path:

- write `.env` with `JOBSPY_PYTHON=<path>`
- confirm only that the local override was saved
- never commit `.env`

If the user does not provide a Python path:

- continue onboarding normally
- explain that scanning will use `python`, `py -3`, or `python3` from PATH

### 2. Identity and Contacts

Ask for:

- full name
- email
- phone
- current location
- relocation availability
- LinkedIn URL
- portfolio, GitHub, or personal site

### 3. Experience

For each relevant role, ask for:

- company
- role title
- location
- start and end dates
- responsibilities
- measurable achievements
- tools and technologies used
- domains or industries

### 4. Projects

For each project, ask for:

- project name
- short description
- technologies
- user's role
- impact or result
- link, if public

### 5. Education and Credentials

Ask for:

- education
- certifications
- courses
- languages and proficiency
- technical skills grouped by category

### 6. Job Preferences

Ask for:

- target roles
- target seniority
- preferred locations
- remote, hybrid, or on-site preference
- salary or contract expectations, if they want to include them
- industries they prefer
- industries they want to avoid
- must-have requirements
- deal breakers
- languages they can work in
- visa or work authorization constraints, if relevant

### 7. Desired Output Language

Ask:

```text
Which language should I use for generated resumes, cover letters, tracker summaries, and recommendations?
```

Store the answer in `profile.md` under `Preferred Output Language`.

The repository instructions remain in English. Candidate-facing artifacts should use the user's preferred language unless the user later asks otherwise.

### 8. Search Settings

Explain that JobSpy can scan multiple job boards. The default sites are `linkedin`, `indeed`, and `google`.

Ask for:

- search keywords or role titles
- search locations
- sites to scan; recommend `linkedin`, `indeed`, and `google`
- maximum result count per search; recommend 10-50 for first tests
- maximum job age in hours; recommend 168 for one week
- whether remote-only filtering should be enabled
- Indeed country name, when Indeed is selected

If the user has no exact keywords, derive them from target roles in `profile.md`.

Create local `scan-config.json` from `scan-config.example.json`:

```json
{
  "provider": "jobspy",
  "sites": ["linkedin", "indeed", "google"],
  "countryIndeed": "Italy",
  "descriptionFormat": "markdown",
  "linkedinFetchDescription": true,
  "resultsWanted": 25,
  "hoursOld": 168,
  "isRemote": null,
  "jobType": "",
  "userAgent": "",
  "proxies": [],
  "searches": [
    {
      "searchTerm": "software engineer",
      "googleSearchTerm": "software engineer jobs near Italy since last week",
      "location": "Italy",
      "resultsWanted": 25,
      "hoursOld": 168,
      "isRemote": null,
      "jobType": ""
    }
  ]
}
```

Add one `searches` item for every useful keyword/location pair. For Google Jobs, set `googleSearchTerm` to the exact query JobSpy should pass to Google.

The JobSpy config read by `scan.mjs` has this shape:

```json
{
  "provider": "jobspy",
  "sites": ["linkedin", "indeed", "google"],
  "searches": [
    {
      "searchTerm": "<role keywords>",
      "googleSearchTerm": "<role keywords> jobs near <location> since last week",
      "location": "<location>",
      "resultsWanted": 25,
      "hoursOld": 168
    }
  ]
}
```

Use the user's chosen sites, locations, result count, remote preference, and country settings.

### 9. Start the First Scan

After `scan-config.json`, `resume.md`, `profile.md`, `jobs.json`, and base `data/` files exist, ask for confirmation to start the first scan.

If the user confirms, run:

```bash
node scan.mjs
```

`scan.mjs` runs JobSpy through `scripts/jobspy-scan.py`, normalizes results, deduplicates jobs, and writes `jobs.json`.

If the user does not confirm, stop after setup and suggest `/scan` as the next step.

## File Formats

### resume.md

Use this structure:

```markdown
# Full Name

**Email:** ...
**Phone:** ...
**Location:** ...
**LinkedIn:** ...
**Portfolio:** ...

## Summary

...

## Experience

### Company - Role
Month YYYY - Month YYYY

- ...

## Projects

### Project

- ...

## Education

- ...

## Certifications

- ...

## Languages

- ...

## Skills

- Category: skill, skill, skill
```

### profile.md

Use this structure:

```markdown
# Job Search Profile

## Preferred Output Language

- English

## Target Roles

- ...

## Target Seniority

- ...

## Locations

- ...

## Work Mode

- Remote:
- Hybrid:
- On-site:

## Deal Breakers

- ...

## Strong Matches

- ...

## Weak Matches

- ...

## Scoring Preferences

- ...

## Languages

- ...

## Salary or Contract Notes

- ...
```

### jobs.json

Create as:

```json
[]
```

### data/filter-progress.json

Create as:

```json
{
  "filtered": []
}
```

### data/generation-progress.json

Create as:

```json
{
  "completed": []
}
```

### data/output-links-state.json

Create as:

```json
{
  "exported": []
}
```

### data/applied-jobs.json

Create as:

```json
{
  "applied": []
}
```

### data/filter-results.md

Create as:

```markdown
# Filter Results
```

### data/application-tracker.md

Create as:

```markdown
# Application Tracker

| # | Date | Company | Role | Score | Status | Files | Job Link | Recruiter |
|---|------|---------|------|-------|--------|-------|----------|-----------|
```

## Completion Message

When onboarding is complete, show:

```text
Setup complete.

Created local private files:
- resume.md
- profile.md
- jobs.json
- scan-config.json
- data/filter-progress.json
- data/generation-progress.json
- data/output-links-state.json
- data/applied-jobs.json
- data/filter-results.md
- data/application-tracker.md

Next step: /scan
```
