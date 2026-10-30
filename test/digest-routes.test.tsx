import { mkdtempSync } from 'node:fs';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

describe('digest routes', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'rig-test-'));
  const config = {
    adapter: 'shim',
    installed: '2026-10-29T14:06:00+01:00',
    beatEverySeconds: 60,
    runsDir: tempDir,
  };

  it('/digest/:night returns 404 for a night with no file', async () => {
    const res = await createApp(config).request('/digest/2026-11-01');
    expect(res.status).toBe(404);
  });

  it('/api/digest/:night returns 404 for a night with no file', async () => {
    const res = await createApp(config).request('/api/digest/2026-11-01');
    expect(res.status).toBe(404);
  });

  it('/digest/:night returns 200 for an empty night with "nothing ran" message', async () => {
    writeFileSync(join(tempDir, '2026-11-02.jsonl'), '');
    const res = await createApp(config).request('/digest/2026-11-02');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('nothing ran');
  });

  it('/api/digest/:night returns 200 with empty rows array for an empty night', async () => {
    writeFileSync(join(tempDir, '2026-11-03.jsonl'), '');
    const res = await createApp(config).request('/api/digest/2026-11-03');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      night: '2026-11-03',
      rows: [],
      badLines: 0,
    });
  });

  it('/digest/:night returns 200 and lists good jobs for a night with a bad line', async () => {
    const nightData = [
      '{"at":"2026-11-04T10:00:00+01:00","job":"test/job1","status":"ok","owner":"user1"}',
      '{"at":"2026-11-04T10:01:00+01:00","job":"test/job2","status":"retry","owner":"user2","error":"timeout"}',
      'this is not valid json',
      '{"at":"2026-11-04T10:02:00+01:00","job":"test/job3","status":"fail","owner":"user3","error":"error message"}',
    ].join('\n');
    writeFileSync(join(tempDir, '2026-11-04.jsonl'), nightData);
    const res = await createApp(config).request('/digest/2026-11-04');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('test/job1');
    expect(html).toContain('test/job2');
    expect(html).toContain('test/job3');
  });

  it('/api/digest/:night returns 200 with badLines count for a night with a bad line', async () => {
    const nightData = [
      '{"at":"2026-11-05T10:00:00+01:00","job":"test/job1","status":"ok","owner":"user1"}',
      '{"at":"2026-11-05T10:01:00+01:00","job":"test/job2","status":"retry","owner":"user2","error":"timeout"}',
      'this is not valid json',
      '{"at":"2026-11-05T10:02:00+01:00","job":"test/job3","status":"fail","owner":"user3","error":"error message"}',
    ].join('\n');
    writeFileSync(join(tempDir, '2026-11-05.jsonl'), nightData);
    const res = await createApp(config).request('/api/digest/2026-11-05');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.badLines).toBe(1);
    expect(json.rows).toHaveLength(3);
    expect(json.rows.map((r: any) => r.job)).toEqual(['test/job1', 'test/job2', 'test/job3']);
  });

  it('/digest/:night returns 200 for a normal night with multiple runs', async () => {
    const nightData = [
      '{"at":"2026-11-06T23:00:02+01:00","job":"rig/rotate-logs","status":"ok","owner":"lane-07"}',
      '{"at":"2026-11-06T23:00:06+01:00","job":"lane/sync","status":"ok","owner":"rook"}',
      '{"at":"2026-11-07T00:00:04+01:00","job":"lane/sync","status":"ok","owner":"rook"}',
      '{"at":"2026-11-07T01:00:05+01:00","job":"lane/sync","status":"ok","owner":"rook"}',
      '{"at":"2026-11-07T01:30:00+01:00","job":"fixtures/refresh","status":"retry","owner":"rook","error":"upstream 503"}',
      '{"at":"2026-11-07T01:31:00+01:00","job":"fixtures/refresh","status":"retry","owner":"rook","error":"upstream 503"}',
      '{"at":"2026-11-07T01:33:00+01:00","job":"fixtures/refresh","status":"retry","owner":"rook","error":"upstream 503"}',
      '{"at":"2026-11-07T01:37:00+01:00","job":"fixtures/refresh","status":"ok","owner":"rook"}',
      '{"at":"2026-11-07T04:00:01+01:00","job":"notes/backup","status":"fail","owner":"lane-07","error":"quota exceeded"}',
    ].join('\n');
    writeFileSync(join(tempDir, '2026-11-06.jsonl'), nightData);
    const res = await createApp(config).request('/digest/2026-11-06');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('fixtures/refresh');
    expect(html).toContain('lane/sync');
    expect(html).toContain('notes/backup');
    expect(html).toContain('rig/rotate-logs');
  });

  it('/api/digest/:night returns 200 with correct structure for a normal night', async () => {
    const nightData = [
      '{"at":"2026-11-07T23:00:02+01:00","job":"rig/rotate-logs","status":"ok","owner":"lane-07"}',
      '{"at":"2026-11-07T23:00:06+01:00","job":"lane/sync","status":"ok","owner":"rook"}',
      '{"at":"2026-11-08T00:00:04+01:00","job":"lane/sync","status":"ok","owner":"rook"}',
      '{"at":"2026-11-08T01:00:05+01:00","job":"lane/sync","status":"ok","owner":"rook"}',
      '{"at":"2026-11-08T01:30:00+01:00","job":"fixtures/refresh","status":"retry","owner":"rook","error":"upstream 503"}',
      '{"at":"2026-11-08T01:31:00+01:00","job":"fixtures/refresh","status":"retry","owner":"rook","error":"upstream 503"}',
      '{"at":"2026-11-08T01:33:00+01:00","job":"fixtures/refresh","status":"retry","owner":"rook","error":"upstream 503"}',
      '{"at":"2026-11-08T01:37:00+01:00","job":"fixtures/refresh","status":"ok","owner":"rook"}',
      '{"at":"2026-11-08T04:00:01+01:00","job":"notes/backup","status":"fail","owner":"lane-07","error":"quota exceeded"}',
    ].join('\n');
    writeFileSync(join(tempDir, '2026-11-07.jsonl'), nightData);
    const res = await createApp(config).request('/api/digest/2026-11-07');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('night', '2026-11-07');
    expect(json).toHaveProperty('rows');
    expect(json).toHaveProperty('badLines', 0);
    expect(Array.isArray(json.rows)).toBe(true);
    expect(json.rows.length).toBeGreaterThan(0);
    for (const row of json.rows) {
      expect(row).toHaveProperty('job');
      expect(row).toHaveProperty('owner');
      expect(row).toHaveProperty('runs');
      expect(row).toHaveProperty('retries');
      expect(row).toHaveProperty('lastStatus');
      expect(row).toHaveProperty('lastError');
      expect(row).toHaveProperty('firstAt');
      expect(row).toHaveProperty('lastAt');
    }
  });

  it('page and JSON list the same jobs in the same order', async () => {
    const nightData = [
      '{"at":"2026-11-09T10:00:00+01:00","job":"rig/rotate-logs","status":"ok","owner":"lane-07"}',
      '{"at":"2026-11-09T10:01:00+01:00","job":"lane/sync","status":"ok","owner":"rook"}',
      '{"at":"2026-11-09T10:02:00+01:00","job":"fixtures/refresh","status":"retry","owner":"rook","error":"upstream 503"}',
      '{"at":"2026-11-09T10:03:00+01:00","job":"notes/backup","status":"fail","owner":"lane-07","error":"quota exceeded"}',
    ].join('\n');
    writeFileSync(join(tempDir, '2026-11-09.jsonl'), nightData);

    const pageRes = await createApp(config).request('/digest/2026-11-09');
    const jsonRes = await createApp(config).request('/api/digest/2026-11-09');

    expect(pageRes.status).toBe(200);
    expect(jsonRes.status).toBe(200);

    const html = await pageRes.text();
    const json = await jsonRes.json();

    const jobsInJson = json.rows.map((r: any) => r.job);
    const expectedJobOrder = [
      'fixtures/refresh',
      'lane/sync',
      'notes/backup',
      'rig/rotate-logs',
    ];

    expect(jobsInJson).toEqual(expectedJobOrder);

    for (const job of expectedJobOrder) {
      expect(html).toContain(job);
    }
  });

  it('/digest/:night handles owner as null', async () => {
    const nightData = [
      '{"at":"2026-11-10T10:00:00+01:00","job":"test/job1","status":"ok","owner":null}',
      '{"at":"2026-11-10T10:01:00+01:00","job":"test/job2","status":"ok","owner":"user1"}',
    ].join('\n');
    writeFileSync(join(tempDir, '2026-11-10.jsonl'), nightData);
    const res = await createApp(config).request('/api/digest/2026-11-10');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.rows).toHaveLength(2);
    const job1Row = json.rows.find((r: any) => r.job === 'test/job1');
    expect(job1Row.owner).toBeNull();
  });

  it('/digest/:night marks retries >= 3', async () => {
    const nightData = [
      '{"at":"2026-11-11T10:00:00+01:00","job":"test/many-retries","status":"retry","owner":"user1"}',
      '{"at":"2026-11-11T10:01:00+01:00","job":"test/many-retries","status":"retry","owner":"user1"}',
      '{"at":"2026-11-11T10:02:00+01:00","job":"test/many-retries","status":"retry","owner":"user1"}',
      '{"at":"2026-11-11T10:03:00+01:00","job":"test/many-retries","status":"ok","owner":"user1"}',
    ].join('\n');
    writeFileSync(join(tempDir, '2026-11-11.jsonl'), nightData);
    const res = await createApp(config).request('/api/digest/2026-11-11');
    expect(res.status).toBe(200);
    const json = await res.json();
    const row = json.rows.find((r: any) => r.job === 'test/many-retries');
    expect(row.retries).toBe(3);
    expect(row.runs).toBe(4);
  });
});
