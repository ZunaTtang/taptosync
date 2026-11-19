/**
 * SRT Formatter
 * SRT 자막 포맷으로 변환
 */

import type { Line } from '@/models/line';

/**
 * 초를 SRT 시간 포맷으로 변환 (HH:MM:SS,mmm)
 * @param seconds 초
 * @returns SRT 시간 문자열
 */
function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
}

/**
 * Line 배열을 SRT 포맷으로 변환
 * @param lines 라인 배열
 * @returns SRT 문자열
 */
export function formatSRT(lines: Line[]): string {
  const linesWithTime = lines.filter(
    l => l.startTime !== undefined && l.endTime !== undefined
  );

  return linesWithTime
    .map((line, index) => {
      const start = formatSRTTime(line.startTime!);
      const end = formatSRTTime(line.endTime!);
      return `${index + 1}\n${start} --> ${end}\n${line.text}\n`;
    })
    .join('\n');
}
