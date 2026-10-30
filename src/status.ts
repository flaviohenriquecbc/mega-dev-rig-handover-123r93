import { readdirSync } from 'node:fs';
import type { RigConfig } from './config.js';
import { lastBeat, type Beat } from './heartbeat.js';
import { countNight } from './digest/counts.js';

export type Status = {
  adapter: string;
  installed: string;
  lastBeat: Beat | null;
  nights: { night: string; counts: { ok: number; retry: number; fail: number } }[];
};

// Nights on disk = runs/<YYYY-MM-DD>.jsonl, newest first.
export function nightsOnDisk(runsDir: string): string[] {
  try {
    return readdirSync(runsDir)
      .filter((f) => /^\d{4}-\d{2}-\d{2}\.jsonl$/.test(f))
      .map((f) => f.slice(0, 10))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

export function readStatus(config: RigConfig): Status {
  const nightStrings = nightsOnDisk(config.runsDir);
  const nights = nightStrings
    .map((night) => {
      const counts = countNight(config.runsDir, night);
      return counts ? { night, counts } : null;
    })
    .filter((n) => n !== null);

  return {
    adapter: config.adapter,
    installed: config.installed,
    lastBeat: lastBeat(),
    nights: nights as { night: string; counts: { ok: number; retry: number; fail: number } }[],
  };
}
