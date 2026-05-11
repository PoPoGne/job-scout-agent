#!/usr/bin/env node

/**
 * JobSpy -> jobs.json
 *
 * Runs the Python JobSpy bridge, normalizes the returned jobs into the local
 * jobs.json contract, deduplicates them, and appends only new jobs.
 */

import { createHash } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = __dirname;
const DEFAULT_PROVIDER = 'jobspy';
const DEFAULT_SITES = ['linkedin', 'indeed', 'google'];

function sleep(ms) {
  return new Promise(resolveSleep => setTimeout(resolveSleep, ms));
}

async function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(await readFile(path, 'utf8'));
}

async function loadEnv() {
  const envPath = resolve(BASE, '.env');
  if (!existsSync(envPath)) return;

  const content = await readFile(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim().replace(/^\uFEFF/, '');
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (key && process.env[key] === undefined) process.env[key] = val;
  }
}

function toArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value === undefined || value === null || value === '') return [];
  return [value];
}

function compact(value) {
  return String(value ?? '').trim();
}

function parseDate(value) {
  if (!value) return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();

  return '';
}

function normalizeLocation(raw) {
  if (typeof raw.location === 'string' && raw.location.trim()) return raw.location.trim();

  const location = raw.location && typeof raw.location === 'object' ? raw.location : {};
  return [
    raw.city ?? location.city,
    raw.state ?? location.state,
    raw.country ?? location.country
  ].map(compact).filter(Boolean).join(', ');
}

function normalizeSalary(raw) {
  const direct = compact(raw.salary);
  if (direct) return direct;

  const interval = compact(raw.interval);
  const min = raw.min_amount ?? raw.salary_min ?? raw.min_salary;
  const max = raw.max_amount ?? raw.salary_max ?? raw.max_salary;
  const currency = compact(raw.currency);

  if (min === undefined && max === undefined) return '';

  const range = [min, max]
    .filter(value => value !== undefined && value !== null && value !== '')
    .join(' - ');

  return [currency, range, interval].filter(Boolean).join(' ');
}

function normalizeWorkplaceTypes(raw) {
  const types = new Set();
  const site = compact(raw.site).toLowerCase();
  const isRemote = raw.is_remote ?? raw.work_remote_allowed;
  const location = normalizeLocation(raw).toLowerCase();

  if (isRemote === true || location.includes('remote')) types.add('Remote');
  if (location.includes('hybrid')) types.add('Hybrid');
  if (types.size === 0 && site) types.add('Unspecified');

  return [...types];
}

function extractLinkedInId(url) {
  const match = String(url ?? '').match(/linkedin\.com\/jobs\/view\/(?:[^/\d-]+-)?(\d+)/i);
  return match?.[1] ?? '';
}

function stableJobId(raw) {
  const site = compact(raw.site).toLowerCase() || 'jobspy';
  const url = compact(raw.job_url_direct || raw.job_url || raw.link || raw.url);
  const sourceId = compact(raw.id || raw.job_id || raw.job_url_id);
  const linkedInId = extractLinkedInId(url);

  if (linkedInId) return `jobspy-linkedin-${linkedInId}`;
  if (sourceId) return `jobspy-${site}-${sourceId}`;

  const fingerprint = [
    site,
    url,
    raw.title,
    raw.company,
    normalizeLocation(raw)
  ].map(compact).join('|');

  return `jobspy-${site}-${createHash('sha1').update(fingerprint).digest('hex').slice(0, 16)}`;
}

function normalizeJob(raw) {
  const link = compact(raw.job_url_direct || raw.job_url || raw.link || raw.url);
  const descriptionText = compact(raw.description || raw.description_text || raw.descriptionText);
  const workplaceTypes = normalizeWorkplaceTypes(raw);
  const site = compact(raw.site).toLowerCase();

  return {
    id: stableJobId(raw),
    source: site || 'jobspy',
    title: compact(raw.title),
    companyName: compact(raw.company || raw.company_name),
    location: normalizeLocation(raw),
    link,
    seniorityLevel: compact(raw.job_level || raw.seniority_level),
    employmentType: compact(raw.job_type || raw.employment_type),
    workplaceTypes,
    workRemoteAllowed: workplaceTypes.includes('Remote'),
    descriptionText,
    expireAt: raw.expire_at ?? raw.expireAt ?? '',
    postedAt: parseDate(raw.date_posted || raw.posted_at || raw.postedAt),
    applicantsCount: compact(raw.applicants_count || raw.num_applicants),
    salary: normalizeSalary(raw),
    jobPosterName: compact(raw.job_poster_name),
    jobPosterTitle: compact(raw.job_poster_title),
    jobPosterProfileUrl: compact(raw.job_poster_profile_url),
    companyWebsite: compact(raw.company_url || raw.company_website)
  };
}

function validateConfig(config) {
  const provider = config.provider ?? DEFAULT_PROVIDER;
  if (provider !== 'jobspy') {
    throw new Error(`Unsupported scan provider "${provider}". This version expects provider: "jobspy".`);
  }

  if (!Array.isArray(config.searches) || config.searches.length === 0) {
    throw new Error('scan-config.json must include at least one search in "searches".');
  }

  for (const [index, search] of config.searches.entries()) {
    if (!compact(search.searchTerm) && !compact(search.googleSearchTerm)) {
      throw new Error(`scan-config.json search #${index + 1} needs searchTerm or googleSearchTerm.`);
    }
  }
}

function runPython(args, commandLabel) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(args[0], args.slice(1), {
      cwd: BASE,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', chunk => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', chunk => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on('error', rejectRun);
    child.on('close', code => {
      if (code !== 0) {
        rejectRun(new Error(`${commandLabel} failed with exit code ${code}${stderr ? `\n${stderr}` : ''}`));
        return;
      }

      resolveRun(stdout);
    });
  });
}

async function runJobSpy(configPath) {
  const bridgePath = resolve(BASE, 'scripts', 'jobspy-scan.py');
  const configured = compact(process.env.JOBSPY_PYTHON).replace(/^"|"$/g, '');
  const candidates = configured
    ? [[configured, bridgePath, configPath]]
    : [
        ['python', bridgePath, configPath],
        ['py', '-3', bridgePath, configPath],
        ['python3', bridgePath, configPath]
      ];

  const errors = [];

  for (const args of candidates) {
    try {
      const stdout = await runPython(args, args.join(' '));
      return JSON.parse(stdout);
    } catch (err) {
      errors.push(err.message);
      if (configured) break;
      await sleep(100);
    }
  }

  throw new Error([
    'Unable to run JobSpy Python bridge.',
    'Install Python dependencies with: python -m pip install -r requirements.txt',
    'If Python is not on PATH, set JOBSPY_PYTHON to the Python executable.',
    '',
    ...errors
  ].join('\n'));
}

async function main() {
  await loadEnv();
  await mkdir(resolve(BASE, 'data'), { recursive: true });

  const configPath = resolve(BASE, 'scan-config.json');
  if (!existsSync(configPath)) {
    throw new Error('Missing scan-config.json. Run onboarding or copy scan-config.example.json.');
  }

  const config = await readJson(configPath, {});
  config.provider = config.provider ?? DEFAULT_PROVIDER;
  config.sites = toArray(config.sites).length > 0 ? toArray(config.sites) : DEFAULT_SITES;
  validateConfig(config);

  console.log('\nProvider: JobSpy');
  console.log(`Sites: ${config.sites.join(', ')}`);
  console.log(`Searches: ${config.searches.length}`);
  console.log('\nStarting JobSpy scan...');

  const rawJobs = await runJobSpy(configPath);
  const items = rawJobs.map(normalizeJob).filter(job => job.id && job.title && job.companyName && job.link);
  const skipped = rawJobs.length - items.length;

  console.log(`\nReceived ${rawJobs.length} jobs from JobSpy`);
  if (skipped > 0) console.log(`Skipped ${skipped} incomplete jobs`);

  const jobsPath = resolve(BASE, 'jobs.json');
  const existing = await readJson(jobsPath, []);
  const existingIds = new Set(existing.map(job => String(job.id)).filter(Boolean));
  console.log(`Jobs already in jobs.json: ${existing.length}`);

  const historyPath = resolve(BASE, 'data', 'scan-history.json');
  const history = await readJson(historyPath, { seen: [] });
  const seenIds = new Set((history.seen ?? []).map(String));
  console.log(`IDs already seen in previous scans: ${seenIds.size}`);

  const filterPath = resolve(BASE, 'data', 'filter-progress.json');
  const filterProgress = await readJson(filterPath, { filtered: [] });
  const filteredIds = new Set((filterProgress.filtered ?? []).map(String));

  const appliedPath = resolve(BASE, 'data', 'applied-jobs.json');
  const appliedState = await readJson(appliedPath, { applied: [] });
  const appliedIds = new Set((appliedState.applied ?? []).map(String));
  const previouslyHandledIds = new Set([...filteredIds, ...appliedIds]);
  console.log(`IDs already filtered/applied: ${previouslyHandledIds.size}`);

  const newItems = items.filter(item => {
    if (existingIds.has(String(item.id))) return false;
    if (seenIds.has(String(item.id))) return false;
    if (previouslyHandledIds.has(String(item.id))) return false;
    return true;
  });

  console.log('\nDeduplication:');
  console.log(`Downloaded: ${items.length}`);
  console.log(`Already present/seen: ${items.length - newItems.length}`);
  console.log(`New jobs to add: ${newItems.length}`);

  if (newItems.length > 0) {
    const updated = [...existing, ...newItems];
    await writeFile(jobsPath, `${JSON.stringify(updated, null, 2)}\n`, 'utf8');
    console.log(`\njobs.json updated: ${existing.length} -> ${updated.length} jobs (+${newItems.length})`);
  } else {
    console.log('\nNo new jobs. jobs.json unchanged.');
  }

  const allSeen = [...new Set([
    ...seenIds,
    ...previouslyHandledIds,
    ...items.map(item => String(item.id)).filter(Boolean)
  ])];

  await writeFile(historyPath, `${JSON.stringify({
    seen: allSeen,
    lastScan: new Date().toISOString(),
    totalSeen: allSeen.length,
    provider: 'jobspy',
    sites: config.sites
  }, null, 2)}\n`, 'utf8');
  console.log(`Scan history updated: ${allSeen.length} total IDs`);

  if (newItems.length > 0) {
    await writeFile(filterPath, `${JSON.stringify({
      ...filterProgress,
      lastScan: new Date().toISOString(),
      newJobsToFilter: newItems.length
    }, null, 2)}\n`, 'utf8');

    console.log('\nNext steps:');
    console.log(`${newItems.length} new jobs are ready for analysis.`);
    console.log('Run /filter to evaluate them.');
  }

  console.log('\nScan complete.\n');
}

main().catch(err => {
  console.error('\nError:', err.message);
  process.exit(1);
});
