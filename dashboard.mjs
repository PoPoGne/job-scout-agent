#!/usr/bin/env node

/**
 * Build a static local dashboard for compatible/generated applications.
 *
 * The generated HTML is written to output/dashboard.html and links to files in
 * output/[slug]/ using relative paths, so it can be opened directly.
 */

import { mkdir, readdir, readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join, relative, resolve } from 'path';
import { fileURLToPath } from 'url';

const base = dirname(fileURLToPath(import.meta.url));
const paths = {
  jobs: resolve(base, 'jobs.json'),
  filterResults: resolve(base, 'data', 'filter-results.md'),
  tracker: resolve(base, 'data', 'application-tracker.md'),
  applied: resolve(base, 'data', 'applied-jobs.json'),
  output: resolve(base, 'output'),
  dashboard: resolve(base, 'output', 'dashboard.html')
};

const TERMINAL_STATUSES = new Set(['rejected', 'closed', 'not interested', 'archived']);

function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'job';
}

function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function attr(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

function parseMarkdownTableRows(markdown) {
  const rows = [];
  let headers = null;

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line.startsWith('|') || !line.endsWith('|')) continue;

    const cells = line
      .slice(1, -1)
      .split('|')
      .map(cell => cell.trim());

    if (cells.every(cell => /^:?-{3,}:?$/.test(cell))) continue;

    const lower = cells.map(cell => cell.toLowerCase());
    if (lower.includes('decision') || lower.includes('status')) {
      headers = lower;
      continue;
    }

    if (!headers) continue;

    const row = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? '';
    });
    rows.push(row);
  }

  return rows;
}

async function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(await readFile(path, 'utf8'));
}

async function readText(path, fallback = '') {
  if (!existsSync(path)) return fallback;
  return readFile(path, 'utf8');
}

function keyFor(company, role) {
  return `${normalize(company)}|${normalize(role)}`;
}

function findJobForRow(row, jobsById, jobs) {
  const id = row.id || row.job || row['job id'];
  if (id && jobsById.has(String(id))) return jobsById.get(String(id));

  const company = row.company;
  const role = row.role || row.title;
  if (!company || !role) return null;

  return jobs.find(job => keyFor(job.companyName, job.title) === keyFor(company, role)) ?? null;
}

async function findPdf(outputDir, prefix) {
  if (!existsSync(outputDir)) return '';

  const files = await readdir(outputDir);
  const exact = files.find(file => file.toLowerCase().startsWith(prefix) && file.toLowerCase().endsWith('.pdf'));
  return exact ? join(outputDir, exact) : '';
}

async function findPdfInDirs(outputDirs, prefix) {
  for (const outputDir of outputDirs) {
    const pdf = await findPdf(outputDir, prefix);
    if (pdf) return pdf;
  }

  return '';
}

function relativeUrl(fromFile, targetFile) {
  return relative(dirname(fromFile), targetFile).replace(/\\/g, '/');
}

function statusClass(status) {
  const clean = normalize(status || 'ready');
  if (clean.includes('applied') || clean.includes('submitted') || clean.includes('sent')) return 'status-applied';
  if (clean.includes('ready') || clean.includes('generated')) return 'status-ready';
  if (TERMINAL_STATUSES.has(clean)) return 'status-closed';
  return 'status-neutral';
}

function renderFileAction(label, href) {
  if (!href) return `<span class="file-missing">${escapeHtml(label)} missing</span>`;
  return `<a class="file-action" href="${attr(href)}" download>${escapeHtml(label)}</a>`;
}

function renderCheckButton(item) {
  const hasFiles = item.resumePdf || item.coverPdf;
  if (!hasFiles) {
    return '<button class="check-action" type="button" disabled>No PDFs</button>';
  }

  return '<button class="check-action" type="button" data-check-action>Check</button>';
}

function renderDashboard(items) {
  const generatedAt = new Date().toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const cards = items.map(item => `
    <article class="job-card" data-job-id="${attr(item.id)}">
      <div class="job-main">
        <div>
          <p class="company">${escapeHtml(item.company)}</p>
          <h2>${escapeHtml(item.role)}</h2>
          <p class="meta">${escapeHtml([item.location, item.source].filter(Boolean).join(' | '))}</p>
        </div>
        <div class="status-stack">
          <span class="status ${statusClass(item.status)}">${escapeHtml(item.status)}</span>
          <span class="review-state" data-review-state>New</span>
        </div>
      </div>
      <div class="score-row">
        <span>Score: <strong>${escapeHtml(item.score || '-')}</strong></span>
        <span>Decision: <strong>${escapeHtml(item.decision || 'PROCEED')}</strong></span>
      </div>
      <div class="actions">
        <a class="job-link" href="${attr(item.link)}" target="_blank" rel="noreferrer" data-open-action>Open job</a>
        ${renderFileAction('Resume PDF', item.resumePdf)}
        ${renderFileAction('Cover PDF', item.coverPdf)}
        ${renderCheckButton(item)}
      </div>
    </article>
  `).join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Application Dashboard</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #172026;
      --muted: #5f6c72;
      --line: #d9e0e3;
      --surface: #ffffff;
      --page: #f6f7f4;
      --green: #1f7a4d;
      --blue: #225c8f;
      --amber: #8a5a00;
      --red: #9b3434;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: var(--page);
      color: var(--ink);
    }

    header {
      border-bottom: 1px solid var(--line);
      background: #eef3ef;
    }

    .wrap {
      width: min(1120px, calc(100% - 32px));
      margin: 0 auto;
    }

    .top {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 24px;
      padding: 32px 0 24px;
    }

    h1 {
      margin: 0 0 8px;
      font-size: 34px;
      line-height: 1.05;
      letter-spacing: 0;
    }

    .subtitle {
      margin: 0;
      color: var(--muted);
      font-size: 15px;
    }

    .count {
      min-width: 132px;
      border: 1px solid var(--line);
      background: var(--surface);
      padding: 12px 14px;
      text-align: right;
    }

    .count strong {
      display: block;
      font-size: 28px;
      line-height: 1;
    }

    main {
      padding: 26px 0 40px;
    }

    .grid {
      display: grid;
      gap: 12px;
    }

    .job-card {
      border: 1px solid var(--line);
      background: var(--surface);
      border-radius: 8px;
      padding: 18px;
    }

    .job-main {
      display: flex;
      justify-content: space-between;
      gap: 18px;
      align-items: start;
    }

    .company {
      margin: 0 0 4px;
      color: var(--blue);
      font-weight: 700;
      font-size: 13px;
      text-transform: uppercase;
    }

    h2 {
      margin: 0;
      font-size: 20px;
      line-height: 1.25;
      letter-spacing: 0;
    }

    .meta {
      margin: 8px 0 0;
      color: var(--muted);
      font-size: 14px;
    }

    .status {
      flex: 0 0 auto;
      border-radius: 999px;
      padding: 6px 10px;
      font-size: 13px;
      font-weight: 700;
      border: 1px solid var(--line);
      white-space: nowrap;
    }

    .status-stack {
      display: flex;
      flex-direction: column;
      align-items: end;
      gap: 8px;
    }

    .status-ready { color: var(--green); background: #e9f6ef; }
    .status-applied { color: var(--blue); background: #e8f1f8; }
    .status-closed { color: var(--red); background: #faecec; }
    .status-neutral { color: var(--amber); background: #fff5dd; }

    .review-state {
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 5px 9px;
      color: var(--muted);
      background: #f3f4f1;
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
    }

    .job-card[data-review-status="opened"] {
      border-color: #9db9d0;
      background: #fbfdff;
    }

    .job-card[data-review-status="checked"] {
      border-color: #9bc9ae;
      background: #fbfffc;
    }

    .job-card[data-review-status="opened"] .review-state {
      color: var(--blue);
      background: #e8f1f8;
      border-color: #bad0e1;
    }

    .job-card[data-review-status="checked"] .review-state {
      color: var(--green);
      background: #e9f6ef;
      border-color: #bad9c9;
    }

    .score-row {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      margin-top: 14px;
      color: var(--muted);
      font-size: 14px;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 16px;
    }

    .job-link,
    .file-action,
    .file-missing,
    .check-action {
      min-height: 36px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 14px;
      text-decoration: none;
      border: 1px solid var(--line);
    }

    .job-link {
      background: var(--ink);
      color: #fff;
      border-color: var(--ink);
    }

    .file-action {
      background: #f7fbf9;
      color: var(--green);
      border-color: #bad9c9;
      font-weight: 700;
    }

    .file-missing {
      color: var(--muted);
      background: #f3f4f1;
    }

    .check-action {
      cursor: pointer;
      color: var(--blue);
      background: #eef6fb;
      border-color: #bad0e1;
      font-weight: 700;
    }

    .check-action:disabled {
      cursor: not-allowed;
      color: var(--muted);
      background: #f3f4f1;
    }

    .job-card[data-review-status="checked"] .check-action {
      color: var(--green);
      background: #e9f6ef;
      border-color: #bad9c9;
    }

    .empty {
      border: 1px dashed var(--line);
      background: var(--surface);
      border-radius: 8px;
      padding: 32px;
      color: var(--muted);
    }

    @media (max-width: 720px) {
      .top,
      .job-main {
        display: block;
      }

      .count {
        margin-top: 16px;
        text-align: left;
      }

      .status {
        display: inline-flex;
        margin-top: 12px;
      }

      .status-stack {
        align-items: start;
        margin-top: 12px;
      }

      h1 { font-size: 28px; }
    }
  </style>
</head>
<body>
  <header>
    <div class="wrap top">
      <div>
        <h1>Application Dashboard</h1>
        <p class="subtitle">Generated ${escapeHtml(generatedAt)} from local job, filter, tracker, and PDF files.</p>
      </div>
      <div class="count">
        <strong>${items.length}</strong>
        compatible jobs
      </div>
    </div>
  </header>
  <main class="wrap">
    ${items.length > 0 ? `<section class="grid">${cards}</section>` : '<section class="empty">No compatible or ready applications found yet. Run /filter, npm run links, or /generate first.</section>'}
  </main>
  <script>
    (() => {
      const storageKey = 'jobScoutDashboardState.v1';
      const labels = {
        new: 'New',
        opened: 'Opened',
        checked: 'Checked'
      };

      function readState() {
        try {
          return JSON.parse(localStorage.getItem(storageKey) || '{}');
        } catch {
          return {};
        }
      }

      function writeState(state) {
        localStorage.setItem(storageKey, JSON.stringify(state));
      }

      function applyCardState(card, value) {
        const state = value || 'new';
        card.dataset.reviewStatus = state;

        const badge = card.querySelector('[data-review-state]');
        if (badge) badge.textContent = labels[state] || labels.new;

        const button = card.querySelector('[data-check-action]');
        if (button) button.textContent = state === 'checked' ? 'Checked' : 'Check';
      }

      const state = readState();

      document.querySelectorAll('[data-job-id]').forEach(card => {
        const id = card.dataset.jobId;
        applyCardState(card, state[id]);

        card.addEventListener('click', event => {
          if (event.target.closest('[data-check-action]')) return;
          if (event.target.closest('.file-action')) return;
          if (state[id] !== 'checked') {
            state[id] = 'opened';
            writeState(state);
            applyCardState(card, state[id]);
          }
        });

        const openAction = card.querySelector('[data-open-action]');
        if (openAction) {
          openAction.addEventListener('click', () => {
            if (state[id] !== 'checked') {
              state[id] = 'opened';
              writeState(state);
              applyCardState(card, state[id]);
            }
          });
        }

        const checkAction = card.querySelector('[data-check-action]');
        if (checkAction) {
          checkAction.addEventListener('click', event => {
            event.stopPropagation();
            state[id] = state[id] === 'checked' ? 'opened' : 'checked';
            writeState(state);
            applyCardState(card, state[id]);
          });
        }
      });
    })();
  </script>
</body>
</html>
`;
}

async function main() {
  await mkdir(paths.output, { recursive: true });

  const jobs = await readJson(paths.jobs, []);
  const jobsById = new Map(jobs.map(job => [String(job.id), job]));
  const appliedState = await readJson(paths.applied, { applied: [] });
  const appliedIds = new Set((appliedState.applied ?? []).map(String));

  const filterMarkdown = await readText(paths.filterResults);
  const filterRows = parseMarkdownTableRows(filterMarkdown)
    .filter(row => normalize(row.decision) === 'proceed');

  const trackerMarkdown = await readText(paths.tracker);
  const trackerRows = parseMarkdownTableRows(trackerMarkdown);
  const trackerByKey = new Map(
    trackerRows.map(row => [keyFor(row.company, row.role || row.title), row])
  );

  const selected = new Map();

  for (const row of filterRows) {
    const job = findJobForRow(row, jobsById, jobs);
    if (!job?.id) continue;
    selected.set(String(job.id), { job, filter: row });
  }

  for (const row of trackerRows) {
    const status = normalize(row.status);
    if (TERMINAL_STATUSES.has(status)) continue;

    const job = findJobForRow(row, jobsById, jobs);
    if (!job?.id) continue;
    selected.set(String(job.id), { job, filter: selected.get(String(job.id))?.filter ?? {}, tracker: row });
  }

  const items = [];

  for (const { job, filter = {} } of selected.values()) {
    const tracker = trackerByKey.get(keyFor(job.companyName, job.title)) ?? {};
    const outputDirs = [
      join(paths.output, slugify(`${job.companyName}-${job.title}`)),
      join(paths.output, slugify(job.companyName))
    ];
    const resumePdf = await findPdfInDirs(outputDirs, 'resume-');
    const coverPdf = await findPdfInDirs(outputDirs, 'cover-');
    const status = tracker.status || (appliedIds.has(String(job.id)) ? 'Applied' : 'Ready');

    items.push({
      id: String(job.id),
      company: job.companyName,
      role: job.title,
      location: job.location,
      source: job.source,
      link: job.link,
      score: filter.score || tracker.score,
      decision: filter.decision || 'PROCEED',
      status,
      resumePdf: resumePdf ? relativeUrl(paths.dashboard, resumePdf) : '',
      coverPdf: coverPdf ? relativeUrl(paths.dashboard, coverPdf) : ''
    });
  }

  items.sort((a, b) =>
    normalize(a.company).localeCompare(normalize(b.company)) ||
    normalize(a.role).localeCompare(normalize(b.role))
  );

  await writeFile(paths.dashboard, renderDashboard(items), 'utf8');
  console.log(`Dashboard written: ${paths.dashboard}`);
  console.log(`Applications shown: ${items.length}`);
}

main().catch(err => {
  console.error('Dashboard build failed:', err.message);
  process.exit(1);
});
