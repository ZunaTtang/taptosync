/**
 * Length-based Weight Allocator
 * 문장 길이에 따른 endTime 분배
 */

import type { Line } from '@/models/line';

/**
 * endTime을 자동 분배하지 않고, 수동 입력된 값만 유지
 * (사용자 종료 탭으로만 endTime을 확정하도록 함)
 */
export function allocateEndTimes(
  lines: Line[],
  _audioDuration: number
): Line[] {
  return lines.map(line => line);
}
