import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DigestRow, Night, ReadNight, RunStatus } from './types.js';

type Entry = { at: string; job: string; status: RunStatus; owner: string | null; error: string | null };

const statuses: readonly string[] = ['ok', 'retry', 'fail'];

function parseLine(line: string): Entry | null {
  let v: unknown;
  try {
    v = JSON.parse(line);
  } catch {
    return null;
  }
  if (typeof v !== 'object' || v === null) return null;
  const o = v as Record<string, unknown>;
  if (typeof o.at !== 'string' || typeof o.job !== 'string') return null;
  if (typeof o.status !== 'string' || !statuses.includes(o.status)) return null;
  return {
    at: o.at,
    job: o.job,
    status: o.status as RunStatus,
    owner: typeof o.owner === 'string' ? o.owner : null,
    error: typeof o.error === 'string' ? o.error : null,
  };
}

export const readNight: ReadNight = (runsDir, night) => {
  let text: string;
  try {
    text = readFileSync(join(runsDir, `${night}.jsonl`), 'utf8');
  } catch {
    return null;
  }
  const byJob = new Map<string, DigestRow>();
  const errorAt = new Map<string, string>();
  let badLines = 0;
  for (const line of text.split('\n')) {
    if (line.trim() === '') continue;
    const e = parseLine(line);
    if (!e) {
      badLines++;
      continue;
    }
    const row = byJob.get(e.job);
    if (!row) {
      if (e.error) errorAt.set(e.job, e.at);
      byJob.set(e.job, {
        job: e.job,
        owner: e.owner,
        runs: 1,
        retries: e.status === 'retry' ? 1 : 0,
        lastStatus: e.status,
        lastError: e.error,
        firstAt: e.at,
        lastAt: e.at,
      });
      continue;
    }
    row.runs++;
    if (e.status === 'retry') row.retries++;
    row.owner = e.owner ?? row.owner;
    if (e.at < row.firstAt) row.firstAt = e.at;
    if (e.at >= row.lastAt) {
      row.lastAt = e.at;
      row.lastStatus = e.status;
    }
    if (e.error && e.at >= (errorAt.get(e.job) ?? '')) {
      errorAt.set(e.job, e.at);
      row.lastError = e.error;
    }
  }
  return { rows: [...byJob.values()].sort((a, b) => a.job.localeCompare(b.job)), badLines };
};
