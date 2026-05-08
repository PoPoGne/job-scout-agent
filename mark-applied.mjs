#!/usr/bin/env node

/**
 * Mark one job as applied so future output link syncs skip it.
 *
 * Usage:
 *   node mark-applied.mjs <job-id-or-company-slug>
 */

import { mkdir, readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const base = dirname(fileURLToPath(import.meta.url));
const jobsPath = resolve(base, 'jobs.json');
const appliedPath = resolve(base, 'data', 'applied-jobs.json');

function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(await readFile(path, 'utf8'));
}

const target = process.argv.slice(2).join(' ').trim();
if (!target) {
  console.error('Usage: node mark-applied.mjs <job-id-or-company-slug>');
  process.exit(1);
}

const jobs = await readJson(jobsPath, []);
const targetSlug = slugify(target);
const job = jobs.find(item =>
  String(item.id) === target ||
  slugify(`${item.companyName}-${item.title}`) === targetSlug ||
  slugify(item.companyName) === targetSlug
);

if (!job?.id) {
  console.error(`No matching job found for: ${target}`);
  process.exit(1);
}

await mkdir(resolve(base, 'data'), { recursive: true });
const state = await readJson(appliedPath, { applied: [] });
const applied = new Set((state.applied ?? []).map(String));
applied.add(String(job.id));

await writeFile(appliedPath, `${JSON.stringify({
  applied: [...applied],
  updatedAt: new Date().toISOString()
}, null, 2)}\n`, 'utf8');

console.log(`Marked as applied: ${job.companyName} - ${job.title}`);
