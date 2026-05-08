#!/usr/bin/env node

/**
 * Reset local runtime files for a fresh job-search run.
 *
 * This script only touches ignored/private runtime files:
 * - data progress/log files
 * - output application artifacts
 *
 * It does not modify resume.md, profile.md, .env, scan-config.json, or templates.
 */

import { mkdir, readdir, rm, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const base = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(base, 'data');
const outputDir = resolve(base, 'output');

async function resetData() {
  await mkdir(dataDir, { recursive: true });

  await writeFile(
    join(dataDir, 'filter-progress.json'),
    `${JSON.stringify({ filtered: [] }, null, 2)}\n`,
    'utf8'
  );

  await writeFile(
    join(dataDir, 'generation-progress.json'),
    `${JSON.stringify({ completed: [] }, null, 2)}\n`,
    'utf8'
  );

  await writeFile(
    join(dataDir, 'output-links-state.json'),
    `${JSON.stringify({ exported: [] }, null, 2)}\n`,
    'utf8'
  );

  await writeFile(
    join(dataDir, 'applied-jobs.json'),
    `${JSON.stringify({ applied: [] }, null, 2)}\n`,
    'utf8'
  );

  await writeFile(join(dataDir, 'filter-results.md'), '# Filter Results\n', 'utf8');

  await writeFile(
    join(dataDir, 'application-tracker.md'),
    [
      '# Application Tracker',
      '',
      '| # | Date | Company | Role | Score | Status | Files | Job Link | Recruiter |',
      '|---|------|---------|------|-------|--------|-------|----------|-----------|',
      ''
    ].join('\n'),
    'utf8'
  );
}

async function resetOutput() {
  await mkdir(outputDir, { recursive: true });

  if (!existsSync(outputDir)) return;

  const entries = await readdir(outputDir, { withFileTypes: true });
  await Promise.all(
    entries
      .filter(entry => entry.name !== '.gitkeep')
      .map(entry => rm(join(outputDir, entry.name), { recursive: true, force: true }))
  );
}

await resetData();
await resetOutput();

console.log('Runtime reset complete. Private candidate files were not changed.');
