import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { RunStatus } from './types.js';

type Counts = {
  ok: number;
  retry: number;
  fail: number;
};

const statuses: readonly string[] = ['ok', 'retry', 'fail'];

function parseLine(line: string): RunStatus | null {
  let v: unknown;
  try {
    v = JSON.parse(line);
  } catch {
    return null;
  }
  if (typeof v !== 'object' || v === null) return null;
  const o = v as Record<string, unknown>;
  if (typeof o.status !== 'string' || !statuses.includes(o.status)) return null;
  return o.status as RunStatus;
}

export function countNight(runsDir: string, night: string): Counts | null {
  let text: string;
  try {
    text = readFileSync(join(runsDir, `${night}.jsonl`), 'utf8');
  } catch {
    return null;
  }

  const counts: Counts = { ok: 0, retry: 0, fail: 0 };

  for (const line of text.split('\n')) {
    if (line.trim() === '') continue;
    const status = parseLine(line);
    if (!status) continue;
    counts[status]++;
  }

  return counts;
}
