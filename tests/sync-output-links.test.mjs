import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const scriptPath = join(repoRoot, 'sync-output-links.mjs');

async function writeJson(path, data) {
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function runSync(base) {
  const result = spawnSync(process.execPath, [scriptPath], {
    env: {
      ...process.env,
      JOB_SCOUT_AGENT_BASE: base
    },
    encoding: 'utf8'
  });

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  return result;
}

test('sync-output-links exports only newly compatible unapplied jobs', async () => {
  const base = await mkdtemp(join(tmpdir(), 'job-scout-agent-'));

  try {
    await mkdir(join(base, 'data'), { recursive: true });

    await writeJson(join(base, 'jobs.json'), [
      {
        id: 'new-job',
        companyName: 'Alpha Co',
        title: 'Backend Engineer',
        link: 'https://jobs.example/alpha'
      },
      {
        id: 'old-job',
        companyName: 'Beta Co',
        title: 'Data Analyst',
        link: 'https://jobs.example/beta'
      },
      {
        id: 'applied-id',
        companyName: 'Gamma Co',
        title: 'ML Engineer',
        link: 'https://jobs.example/gamma'
      },
      {
        id: 'tracked-applied',
        companyName: 'Delta Co',
        title: 'Platform Engineer',
        link: 'https://jobs.example/delta'
      },
      {
        id: 'tracked-rejected',
        companyName: 'Epsilon Co',
        title: 'AI Engineer',
        link: 'https://jobs.example/epsilon'
      },
      {
        id: 'not-proceed',
        companyName: 'Zeta Co',
        title: 'Frontend Engineer',
        link: 'https://jobs.example/zeta'
      }
    ]);

    await writeFile(
      join(base, 'data', 'filter-results.md'),
      [
        '| ID | Company | Role | Decision |',
        '| --- | --- | --- | --- |',
        '| new-job | Alpha Co | Backend Engineer | PROCEED |',
        '| old-job | Beta Co | Data Analyst | PROCEED |',
        '| applied-id | Gamma Co | ML Engineer | PROCEED |',
        '| tracked-applied | Delta Co | Platform Engineer | PROCEED |',
        '| tracked-rejected | Epsilon Co | AI Engineer | PROCEED |',
        '| not-proceed | Zeta Co | Frontend Engineer | REJECT |',
        ''
      ].join('\n'),
      'utf8'
    );

    await writeFile(
      join(base, 'data', 'application-tracker.md'),
      [
        '| Company | Role | Status |',
        '| --- | --- | --- |',
        '| Delta Co | Platform Engineer | Applied |',
        '| Epsilon Co | AI Engineer | Rejected |',
        ''
      ].join('\n'),
      'utf8'
    );

    await writeJson(join(base, 'data', 'applied-jobs.json'), {
      applied: ['applied-id']
    });
    await writeJson(join(base, 'data', 'output-links-state.json'), {
      exported: ['old-job']
    });

    const result = runSync(base);

    assert.match(result.stdout, /Compatible jobs found: 2/);
    assert.match(result.stdout, /New links added to output: 1/);

    const newLinkPath = join(base, 'output', 'alpha-co-backend-engineer', 'link.txt');
    assert.equal(await readFile(newLinkPath, 'utf8'), 'https://jobs.example/alpha\n');

    assert.equal(existsSync(join(base, 'output', 'beta-co-data-analyst')), false);
    assert.equal(existsSync(join(base, 'output', 'gamma-co-ml-engineer')), false);
    assert.equal(existsSync(join(base, 'output', 'delta-co-platform-engineer')), false);
    assert.equal(existsSync(join(base, 'output', 'epsilon-co-ai-engineer')), false);
    assert.equal(existsSync(join(base, 'output', 'zeta-co-frontend-engineer')), false);

    const bat = await readFile(join(base, 'output', 'open-new-compatible-links.bat'), 'utf8');
    assert.match(bat, /https:\/\/jobs\.example\/alpha/);
    assert.doesNotMatch(bat, /https:\/\/jobs\.example\/beta/);

    const state = JSON.parse(await readFile(join(base, 'data', 'output-links-state.json')));
    assert.deepEqual(state.exported.sort(), ['new-job', 'old-job']);
    assert.deepEqual(state.lastRun.added, ['new-job']);
  } finally {
    await rm(base, { recursive: true, force: true });
  }
});
