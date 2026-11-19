/**
 * Tap Timestamp Collector
 * Tap 입력으로 timestamp를 수집하는 모듈
 */

import type { Line } from '@/models/line';

/**
 * 특정 라인에 timestamp를 설정
 * @param lines 라인 배열
 * @param lineId 타겟 라인 ID
 * @param timestamp 설정할 timestamp (초)
 * @returns 업데이트된 라인 배열
 */
export function setTimestamp(
  lines: Line[],
  lineId: string,
  timestamp: number
): Line[] {
  return lines.map(line => {
    if (line.id === lineId) {
      return { ...line, startTime: timestamp };
    }
    return line;
  });
}

/**
 * 다음 순서의 라인 ID를 찾기
 * @param lines 라인 배열
 * @param currentOrder 현재 순서
 * @returns 다음 라인 ID 또는 null
 */
export function getNextLineId(lines: Line[], currentOrder: number): string | null {
  const nextLine = lines.find(line => line.order === currentOrder + 1);
  return nextLine?.id ?? null;
}
