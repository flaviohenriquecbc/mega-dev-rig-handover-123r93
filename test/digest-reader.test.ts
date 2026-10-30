import { describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/read.js';

describe('readNight', () => {
  it('reads 2026-10-28: 5 jobs, 1 bad line', () => {
    const night = readNight('runs', '2026-10-28');
    expect(night?.rows).toHaveLength(5);
    expect(night?.badLines).toBe(1);
  });

  it('returns null for a night with no file', () => {
    expect(readNight('runs', '1999-01-01')).toBeNull();
  });
});
