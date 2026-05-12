#!/usr/bin/env node

/**
 * Export newly compatible job links into output/ and create a Windows BAT opener.
 *
 * Source of truth:
 * - jobs.json
 * - data/filter-results.md
 * - data/application-tracker.md
 * - data/applied-jobs.json
 * - data/output-links-state.json
 *
 * The script adds only newly compatible jobs to output/[slug]/link.txt and writes
 * output/open-new-compatible-links.bat for the new links found in the current run.
 */

import { mkdir, readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const defaultBase = dirname(fileURLToPath(import.meta.url));
const base = process.env.JOB_SCOUT_AGENT_BASE
  ? resolve(process.env.JOB_SCOUT_AGENT_BASE)
  : defaultBase;
const paths = {
  jobs: resolve(base, 'jobs.json'),
  filterResults: resolve(base, 'data', 'filter-results.md'),
  tracker: resolve(base, 'data', 'application-tracker.md'),
  applied: resolve(base, 'data', 'applied-jobs.json'),
  state: resolve(base, 'data', 'output-links-state.json'),
  output: resolve(base, 'output'),
  bat: resolve(base, 'output', 'open-new-compatible-links.bat'),
  lastRunMarkdown: resolve(base, 'output', 'new-compatible-links.md'),
  allMarkdown: resolve(base, 'output', 'compatible-links.md')
};

const APPLIED_STATUSES = new Set([
  'applied',
  'submitted',
  'sent',
  'candidate',
  'candidated',
  'rejected',
  'closed',
  'not interested',
  'archived'
]);

function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'job';
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

function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

function isAppliedStatus(status) {
  const clean = normalize(status);
  return [...APPLIED_STATUSES].some(applied => clean.includes(applied));
}

function batchEscape(url) {
  return String(url).replace(/%/g, '%%').replace(/"/g, '\\"');
}

async function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(await readFile(path, 'utf8'));
}

function findJobForResult(result, jobsById, jobs) {
  const id = result.id || result.job || result['job id'];
  if (id && jobsById.has(String(id))) return jobsById.get(String(id));

  const company = normalize(result.company);
  const role = normalize(result.role || result.title);
  if (!company || !role) return null;

  return jobs.find(job =>
    normalize(job.companyName) === company &&
    normalize(job.title) === role
  ) ?? null;
}

async function main() {
  await mkdir(paths.output, { recursive: true });

  if (!existsSync(paths.jobs)) {
    throw new Error('Missing jobs.json. Run /scan first.');
  }

  if (!existsSync(paths.filterResults)) {
    throw new Error('Missing data/filter-results.md. Run /filter first.');
  }

  const jobs = await readJson(paths.jobs, []);
  const jobsById = new Map(jobs.map(job => [String(job.id), job]));

  const filterMarkdown = await readFile(paths.filterResults, 'utf8');
  const filterRows = parseMarkdownTableRows(filterMarkdown)
    .filter(row => normalize(row.decision) === 'proceed');

  const trackerMarkdown = existsSync(paths.tracker)
    ? await readFile(paths.tracker, 'utf8')
    : '';
  const trackerRows = parseMarkdownTableRows(trackerMarkdown);
  const appliedKeys = new Set(
    trackerRows
      .filter(row => isAppliedStatus(row.status))
      .map(row => `${normalize(row.company)}|${normalize(row.role)}`)
  );
  const appliedState = await readJson(paths.applied, { applied: [] });
  const appliedIds = new Set((appliedState.applied ?? []).map(String));

  const state = await readJson(paths.state, { exported: [] });
  const exported = new Set((state.exported ?? []).map(String));

  const compatible = [];
  const newlyAdded = [];

  for (const row of filterRows) {
    const job = findJobForResult(row, jobsById, jobs);
    if (!job?.id || !job?.link) continue;

    const key = `${normalize(job.companyName)}|${normalize(job.title)}`;
    if (appliedKeys.has(key)) continue;
    if (appliedIds.has(String(job.id))) continue;

    const slug = slugify(`${job.companyName}-${job.title}`);
    const item = {
      id: String(job.id),
      company: job.companyName,
      role: job.title,
      link: job.link,
      slug
    };
    compatible.push(item);

    if (exported.has(item.id)) continue;

    const jobOutputDir = join(paths.output, slug);
    await mkdir(jobOutputDir, { recursive: true });
    await writeFile(join(jobOutputDir, 'link.txt'), `${item.link}\n`, 'utf8');

    exported.add(item.id);
    newlyAdded.push(item);
  }

  const batLines = [
    '@echo off',
    'setlocal',
    `echo Opening ${newlyAdded.length} new compatible job link(s)...`
  ];

  for (const item of newlyAdded) {
    batLines.push(`start "" "${batchEscape(item.link)}"`);
  }

  if (newlyAdded.length === 0) {
    batLines.push('echo No new compatible job links to open.');
  }

  batLines.push('endlocal');
  await writeFile(paths.bat, `${batLines.join('\r\n')}\r\n`, 'utf8');

  const lastRunMarkdown = [
    '# New Compatible Links',
    '',
    ...newlyAdded.map(item => `- [${item.company} - ${item.role}](${item.link})`),
    ''
  ].join('\n');
  await writeFile(paths.lastRunMarkdown, lastRunMarkdown, 'utf8');

  const allMarkdown = [
    '# Compatible Links',
    '',
    ...compatible.map(item => `- [${item.company} - ${item.role}](${item.link})`),
    ''
  ].join('\n');
  await writeFile(paths.allMarkdown, allMarkdown, 'utf8');

  await writeFile(paths.state, `${JSON.stringify({
    exported: [...exported],
    lastRun: {
      at: new Date().toISOString(),
      added: newlyAdded.map(item => item.id)
    }
  }, null, 2)}\n`, 'utf8');

  console.log(`Compatible jobs found: ${compatible.length}`);
  console.log(`New links added to output: ${newlyAdded.length}`);
  console.log(`BAT file: ${paths.bat}`);
}

main().catch(err => {
  console.error('Output link sync failed:', err.message);
  process.exit(1);
});
