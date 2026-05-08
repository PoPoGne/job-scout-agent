# Onboarding - First Run

Use this workflow when the project is empty, when private files are missing, or when example placeholders have not been replaced.

Goal: collect enough information to create local private files so the user can run the complete job-matching pipeline with any AI coding agent.

## Files to Create

- `.env`
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

1. Apify token.
2. Identity and contact details.
3. Work history and projects.
4. Education, certifications, skills, languages.
5. Job preferences and constraints.
6. Desired output language.
7. LinkedIn scan settings.
8. Confirm and start the Apify Actor run.

If the user already has a resume, ask them to paste it or provide a path. Convert it into `resume.md`.

## Questions to Ask

### 1. Apify Token

This project uses Apify as the only LinkedIn job-scan provider.

Apify can be used for initial tests without paying if the user stays within the monthly free usage credit. At the time this template was created, Apify's free plan included about $5/month of platform usage credit. Recommend a low `count` during onboarding, such as 25, 50, or 100, especially when testing for the first time.

Actor:

```text
https://console.apify.com/actors/hKByXkMQaC5Qt9UMN/input
```

Ask first:

```text
To scan LinkedIn jobs, I need your Apify API token. Paste it here and I will save it only in the local .env file, which is ignored by Git. If you prefer not to paste it in chat, create .env yourself with APIFY_TOKEN=your_token_here.
```

If the user provides the token:

- write `.env` with `APIFY_TOKEN=<token>`
- do not echo the token
- confirm only: `Token saved in .env`

If the user does not provide the token:

- continue onboarding if they want to prepare files
- do not run `/scan`
- explain that scanning cannot run until `.env` contains `APIFY_TOKEN`

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

### 8. LinkedIn Scan Settings

Explain that the Apify Actor needs LinkedIn job-search URLs as input, and that the AI can generate them from the user's target roles and locations.

Ask for:

- search keywords or role titles
- search locations
- maximum result count per scan; recommend 25-100 for first tests to stay within free Apify usage
- whether to scrape company details
- whether to split searches by location

If the user has no exact keywords, derive them from target roles in `profile.md`.

Create one LinkedIn job-search URL for every useful keyword/location pair:

```text
https://www.linkedin.com/jobs/search/?keywords=<encoded keywords>&location=<encoded location>&position=1&pageNum=0
```

Encoding rules:

- Use URL encoding.
- Spaces in keywords may be encoded as `+` or `%20`.
- Commas in locations should be encoded as `%2C`.
- Do not include private personal information in URLs.

Examples:

```text
keyword: target role
location: target city or country
url: https://www.linkedin.com/jobs/search/?keywords=target+role&location=target+location&position=1&pageNum=0
```

```text
keyword: data analyst
location: Remote
url: https://www.linkedin.com/jobs/search/?keywords=data+analyst&location=Remote&position=1&pageNum=0
```

Create local `scan-config.json` from `scan-config.example.json`:

```json
{
  "actorId": "hKByXkMQaC5Qt9UMN",
  "actorInputUrl": "https://console.apify.com/actors/hKByXkMQaC5Qt9UMN/input",
  "count": 500,
  "scrapeCompany": true,
  "splitByLocation": false,
  "urls": []
}
```

Then fill `urls` with the generated LinkedIn search URLs.

The Actor input sent by `scan.mjs` has this shape:

```json
{
  "count": 100,
  "scrapeCompany": true,
  "splitByLocation": false,
  "urls": [
    "https://www.linkedin.com/jobs/search/?keywords=<encoded-keywords>&location=<encoded-location>&position=1&pageNum=0"
  ]
}
```

Use the user's chosen `count`, `scrapeCompany`, `splitByLocation`, and generated `urls`.

### 9. Start the Apify Actor Run

After `.env`, `scan-config.json`, `resume.md`, `profile.md`, `jobs.json`, and base `data/` files exist, ask for confirmation to start the first scan.

If the user confirms, run:

```bash
node scan.mjs
```

`scan.mjs` starts an Apify run for Actor `hKByXkMQaC5Qt9UMN`, waits for completion, downloads the dataset, deduplicates jobs, and writes `jobs.json`.

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
- .env
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
