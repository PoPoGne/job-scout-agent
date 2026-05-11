# Generate Resume + Cover Letter - Step 2

## Input

`data/filter-results.md`, `data/generation-progress.json`, `jobs.json`, `resume.md`, `profile.md`, `templates/resume-template.html`, `templates/cover-template.html`.

## Progress

Read `data/generation-progress.json` with format `{ "completed": [] }`. Create it if missing.
Exclude IDs already in `completed`.
Process up to 20 `PROCEED` jobs per batch, sorted by score descending when available.
After each job, add the ID to `completed` and save immediately.

## Language

Read `Preferred Output Language` from `profile.md`.
Generate resume content, cover letters, tracker summaries, and recommendations in that language.
If the user requests a different language for a specific job, follow that explicit request and note it in the tracker.

## Slug

Convert `companyName` + `title` to lowercase, spaces to hyphens, and remove special characters so it matches `npm run links`.
Examples: `HelloFresh - Frontend Developer` -> `hellofresh-frontend-developer`, `n8n GmbH - Support Engineer` -> `n8n-gmbh-support-engineer`.

## Output per Job

```text
output/[slug]/
  resume-[slug].html
  resume-[slug].pdf
  cover-[slug].html
  cover-[slug].pdf
  link.txt
```

`link.txt` contains one line: the job `link`.

## Per Job

### 1. Data from jobs.json

Find the job by `id`. Extract: `title`, `companyName`, `location`, `link`, `descriptionText`, `workplaceTypes`, `salary`, `jobPosterName`, `jobPosterTitle`, `jobPosterProfileUrl`.

### 2. Job Description Analysis

Use internally:

- top 5-8 keywords
- tone
- 2-3 real proof points from `resume.md`
- main gap

### 3. Resume - Fill resume-template.html

Fixed placeholders, derived from `resume.md` and `profile.md`. If a field does not exist, leave it empty or use a neutral value.

```text
{{NAME}}                   -> candidate name
{{LANG}}                   -> output language code when known
{{PAGE_WIDTH}}             -> 210mm
{{PHONE}}                  -> candidate phone
{{EMAIL}}                  -> candidate email
{{LINKEDIN_URL}}           -> candidate LinkedIn URL
{{LINKEDIN_DISPLAY}}       -> compact LinkedIn text
{{PORTFOLIO_URL}}          -> candidate portfolio/GitHub URL
{{PORTFOLIO_DISPLAY}}      -> compact portfolio text
{{LOCATION}}               -> candidate location and availability
{{SECTION_SUMMARY}}        -> localized section title
{{SECTION_COMPETENCIES}}   -> localized section title
{{SECTION_EXPERIENCE}}     -> localized section title
{{SECTION_PROJECTS}}       -> localized section title
{{SECTION_EDUCATION}}      -> localized section title
{{SECTION_CERTIFICATIONS}} -> localized section title
{{SECTION_SKILLS}}         -> localized section title
```

Variable placeholders adapted to the job:

```text
{{SUMMARY_TEXT}}   -> 3-4 lines emphasizing relevant real skills
{{COMPETENCIES}}   -> 8-10 HTML tags: <span class="competency-tag">...</span>
{{EXPERIENCE}}     -> HTML experience blocks, job-relevant framing
{{PROJECTS}}       -> 2-3 relevant HTML project blocks
{{EDUCATION}}      -> HTML education blocks
{{CERTIFICATIONS}} -> HTML certification blocks
{{SKILLS}}         -> HTML skill blocks by category
```

Use only facts from `resume.md`.

Save `output/[slug]/resume-[slug].html`.

### 4. Cover Letter - Fill cover-template.html

Use the same candidate data.

```text
{{DATE}}    -> current date localized to output language when possible
{{COMPANY}} -> companyName
{{ROLE}}    -> title
{{BODY}}    -> 4 HTML paragraphs: <p>...</p>
```

Body:

1. Specific hook tied to the company or job description.
2. Concrete proof point from `resume.md`.
3. Honest gap and how the candidate addresses it.
4. Direct close.

Save `output/[slug]/cover-[slug].html`.

### 5. link.txt

Write `output/[slug]/link.txt` with one line: job `link`.

### 6. PDF

```bash
node generate-pdf.mjs output/[slug]/resume-[slug].html output/[slug]/resume-[slug].pdf
node generate-pdf.mjs output/[slug]/cover-[slug].html output/[slug]/cover-[slug].pdf
```

### 7. Tracker

Add or update one row in `data/application-tracker.md`:

```text
| # | date | companyName | title | score | Ready | generated | link | jobPosterProfileUrl or - |
```

Do not duplicate the same company + role combination.

Use `Status` consistently so output link sync can exclude already handled jobs:

- `Ready`: generated, not yet submitted
- `Applied`: submitted by the user
- `Rejected`: rejected or no longer worth pursuing
- `Closed`: job closed or unavailable

## Rules

- Do not invent skills, achievements, metrics, education, certifications, or languages not present in `resume.md`.
- Use `descriptionText`, not `descriptionHtml`.
- If a job description is in a different language from the desired output language, still generate the application in the desired output language.
- Read `resume.md` for each job; do not rely on memory.

## After Batch

Show:

```text
Batch complete. Remaining: X PROCEED jobs.
Reply continue to process the next 20, or stop to pause.
```

If all selected jobs are complete, show:

```text
Done. output/ contains one folder per application. Run npm run dashboard to review PDF downloads, or use /tracker for a summary.
```
