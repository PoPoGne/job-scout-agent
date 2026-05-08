#!/usr/bin/env node

/**
 * Apify LinkedIn Jobs Scraper -> jobs.json
 *
 * Starts an Apify run, waits for completion, downloads results,
 * deduplicates against existing local jobs, and appends only new jobs.
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = __dirname;
const DEFAULT_ACTOR_ID = 'hKByXkMQaC5Qt9UMN';
const ACTOR_INPUT_URL = 'https://console.apify.com/actors/hKByXkMQaC5Qt9UMN/input';

async function loadEnv() {
  const envPath = resolve(BASE, '.env');
  if (!existsSync(envPath)) {
    throw new Error('Missing .env. Create it with: APIFY_TOKEN=your_token');
  }

  const content = await readFile(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    process.env[key] = val;
  }
}

async function apifyGet(path, token) {
  const url = `https://api.apify.com/v2${path}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GET ${path} -> ${res.status}: ${body}`);
  }

  return res.json();
}

async function apifyPost(path, token, body) {
  const url = `https://api.apify.com/v2${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} -> ${res.status}: ${text}`);
  }

  return res.json();
}

function sleep(ms) {
  return new Promise(resolveSleep => setTimeout(resolveSleep, ms));
}

async function main() {
  await loadEnv();

  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error('Missing APIFY_TOKEN in .env');

  await mkdir(resolve(BASE, 'data'), { recursive: true });

  const configPath = resolve(BASE, 'scan-config.json');
  if (!existsSync(configPath)) {
    throw new Error('Missing scan-config.json. Run onboarding to generate LinkedIn search URLs.');
  }

  const config = JSON.parse(await readFile(configPath, 'utf8'));
  config.actorId = config.actorId || DEFAULT_ACTOR_ID;

  if (!Array.isArray(config.urls) || config.urls.length === 0) {
    throw new Error('scan-config.json has no LinkedIn URLs. Run onboarding and add search keywords/locations.');
  }

  console.log(`\nActor: ${config.actorId}`);
  console.log(`Actor input page: ${ACTOR_INPUT_URL}`);
  console.log(`Search URLs: ${config.urls.length}`);
  console.log(`Count: ${config.count ?? 500} | scrapeCompany: ${config.scrapeCompany ?? true} | splitByLocation: ${config.splitByLocation ?? false}`);

  const jobsPath = resolve(BASE, 'jobs.json');
  const existing = existsSync(jobsPath)
    ? JSON.parse(await readFile(jobsPath, 'utf8'))
    : [];
  const existingIds = new Set(existing.map(job => String(job.id)).filter(Boolean));
  console.log(`\nJobs already in jobs.json: ${existing.length}`);

  const historyPath = resolve(BASE, 'data/scan-history.json');
  const history = existsSync(historyPath)
    ? JSON.parse(await readFile(historyPath, 'utf8'))
    : { seen: [] };
  const seenIds = new Set(history.seen.map(String));
  console.log(`IDs already seen in previous scans: ${seenIds.size}`);

  console.log('\nStarting Apify run...');
  const runRes = await apifyPost(`/acts/${config.actorId}/runs`, token, {
    urls: config.urls,
    count: config.count ?? 500,
    scrapeCompany: config.scrapeCompany ?? true,
    splitByLocation: config.splitByLocation ?? false
  });

  const runId = runRes.data.id;
  const datasetId = runRes.data.defaultDatasetId;
  console.log(`Run ID: ${runId}`);
  console.log(`Dataset ID: ${datasetId}`);

  console.log('\nWaiting for run completion...');
  const POLL_INTERVAL_MS = 10_000;
  const MAX_WAIT_MS = 15 * 60 * 1000;
  let elapsed = 0;
  let status = 'CREATED';
  const pending = new Set(['CREATED', 'READY', 'RUNNING']);

  while (pending.has(status)) {
    await sleep(POLL_INTERVAL_MS);
    elapsed += POLL_INTERVAL_MS;

    const runData = await apifyGet(`/actor-runs/${runId}`, token);
    status = runData.data.status;

    const mins = Math.floor(elapsed / 60000);
    const secs = Math.floor((elapsed % 60000) / 1000);
    process.stdout.write(`\r   ${mins}m${secs}s - status: ${status}        `);

    if (elapsed >= MAX_WAIT_MS) {
      throw new Error('Timeout: Apify run did not complete within 15 minutes');
    }
  }

  console.log(`\nRun finished: ${status}`);
  if (status !== 'SUCCEEDED') throw new Error(`Apify run failed with status: ${status}`);

  console.log('\nDownloading dataset items...');
  const itemsRes = await apifyGet(
    `/datasets/${datasetId}/items?format=json&clean=true&limit=2000`,
    token
  );
  const items = Array.isArray(itemsRes) ? itemsRes : (itemsRes.items ?? []);
  console.log(`Received ${items.length} jobs from the run`);

  const newItems = items.filter(item => {
    const id = String(item.id ?? '');
    if (!id) return false;
    if (existingIds.has(id)) return false;
    if (seenIds.has(id)) return false;
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
    ...items.map(item => String(item.id ?? '')).filter(Boolean)
  ])];

  await writeFile(historyPath, `${JSON.stringify({
    seen: allSeen,
    lastScan: new Date().toISOString(),
    totalSeen: allSeen.length
  }, null, 2)}\n`, 'utf8');
  console.log(`Scan history updated: ${allSeen.length} total IDs`);

  if (newItems.length > 0) {
    const filterPath = resolve(BASE, 'data/filter-progress.json');
    const filterProgress = existsSync(filterPath)
      ? JSON.parse(await readFile(filterPath, 'utf8'))
      : { filtered: [] };

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
