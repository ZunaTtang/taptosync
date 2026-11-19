/**
 * LRC Formatter
 * LRC 가사 포맷으로 변환
 */

import type { Line } from '@/models/line';

/**
 * 초를 LRC 시간 포맷으로 변환 (MM:SS.xx)
 * @param seconds 초
 * @returns LRC 시간 문자열
 */
function formatLRCTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const secsInt = Math.floor(secs);
  const centiseconds = Math.floor((secs % 1) * 100);

  return `${String(minutes).padStart(2, '0')}:${String(secsInt).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
}

/**
 * Line 배열을 LRC 포맷으로 변환
 * @param lines 라인 배열
 * @returns LRC 문자열
 */
export function formatLRC(lines: Line[]): string {
  const linesWithTime = lines.filter(
    l => l.startTime !== undefined
  );

  return linesWithTime
    .map(line => `[${formatLRCTime(line.startTime!)}]${line.text}`)
    .join('\n');
}
