import type { Night } from '../digest/types.js';

export function DigestView({ night, data }: { night: string; data: Night | null }) {
  if (data === null) {
    return (
      <>
        <h1>digest</h1>
        <p class="warn">no run log for {night}</p>
      </>
    );
  }

  if (data.rows.length === 0) {
    return (
      <>
        <h1>digest</h1>
        <p class="mute">nothing ran</p>
      </>
    );
  }

  return (
    <>
      <h1>digest</h1>
      <table>
        <thead>
          <tr>
            <th>job</th>
            <th>owner</th>
            <th>runs</th>
            <th>retries</th>
            <th>last status</th>
            <th>last error</th>
            <th>first</th>
            <th>last</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row) => {
            const isWarning = row.retries >= 3 || row.lastStatus === 'fail';
            return (
              <tr class={isWarning ? 'warn' : ''}>
                <td>{row.job}</td>
                <td>{row.owner ?? '—'}</td>
                <td>{row.runs}</td>
                <td>{isWarning && row.retries >= 3 ? `${row.retries} ⚠` : row.retries}</td>
                <td>{isWarning && row.lastStatus === 'fail' ? `${row.lastStatus} ⚠` : row.lastStatus}</td>
                <td>{row.lastError ?? '—'}</td>
                <td>{row.firstAt}</td>
                <td>{row.lastAt}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
