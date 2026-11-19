/**
 * CapCut CSV Formatter
 * CapCut 편집기 호환 CSV 포맷으로 변환
 */

import type { Line } from '@/models/line';

/**
 * CSV 필드 이스케이프 처리
 * @param text 원본 텍스트
 * @returns 이스케이프된 텍스트
 */
function escapeCSV(text: string): string {
  // 따옴표가 있으면 이중 따옴표로 변환하고 전체를 따옴표로 감싸기
  if (text.includes('"') || text.includes(',') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/**
 * Line 배열을 CapCut CSV 포맷으로 변환
 * @param lines 라인 배열
 * @returns CSV 문자열
 */
export function formatCapCutCSV(lines: Line[]): string {
  const linesWithTime = lines.filter(
    l => l.startTime !== undefined && l.endTime !== undefined
  );

  const header = 'start,end,text';
  const rows = linesWithTime.map(line => {
    const start = line.startTime!.toFixed(1);
    const end = line.endTime!.toFixed(1);
    const text = escapeCSV(line.text);
    return `${start},${end},${text}`;
  });

  return [header, ...rows].join('\n');
}
