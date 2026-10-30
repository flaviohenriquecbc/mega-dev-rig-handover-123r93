import { Hono } from 'hono';
import { loadConfig, type RigConfig } from './config.js';
import { lane } from './lane.js';
import { readNight } from './digest/read.js';
import { readStatus } from './status.js';
import { Layout } from './views/layout.js';
import { StatusBoard } from './views/status.js';
import { DigestView } from './views/digest.js';

export function createApp(config: RigConfig = loadConfig()) {
  const app = new Hono();

  app.get('/health', (c) => c.json({ ok: true, lane: lane().id }));

  app.get('/api/digest/:night', (c) => {
    const night = c.req.param('night');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(night)) {
      return c.json({ error: 'not found' }, 404);
    }
    const result = readNight(config.runsDir, night);
    if (!result) {
      return c.json({ error: 'not found' }, 404);
    }
    return c.json({ night, rows: result.rows, badLines: result.badLines });
  });

  app.get('/', (c) =>
    c.html(
      <Layout title="status" lane={lane()}>
        <StatusBoard status={readStatus(config)} />
      </Layout>,
    ),
  );

  app.get('/digest/:night', (c) => {
    const night = c.req.param('night');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(night)) {
      c.status(404);
      return c.html(
        <Layout title="digest" lane={lane()}>
          <DigestView night={night} data={null} />
        </Layout>,
      );
    }
    const data = readNight(config.runsDir, night);
    if (!data) c.status(404);
    return c.html(
      <Layout title="digest" lane={lane()}>
        <DigestView night={night} data={data} />
      </Layout>,
    );
  });

  return app;
}
