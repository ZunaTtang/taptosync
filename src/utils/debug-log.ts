import type { Line } from '@/models/line';

export const logLines = (
  location: string,
  runId: string,
  hypothesisId: string,
  linesSnapshot: Line[],
) => {
  const snapshot = linesSnapshot.map((l) => ({
    id: l.id,
    start: l.startTime,
    end: l.endTime,
    order: l.order,
  }));

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/41a3d5a8-1690-4b8d-ba87-c41877d5e201', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId,
      hypothesisId,
      location,
      message: 'lines snapshot',
      data: { snapshot },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
};
