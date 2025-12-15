/**
 * Timeline Scaling Module
 * 전체 길이 비율 보정
 */

import type { Line } from '@/models/line';

export interface ScalingOptions {
  threshold?: number;  // 보정을 적용할 임계값 (비율 차이)
}

const DEFAULT_THRESHOLD = 0.2; // 20% 이상 차이나면 보정

/**
 * 전체 타임라인을 오디오 길이에 맞게 스케일링
 * @param lines 라인 배열
 * @param audioDuration 오디오 전체 길이 (초)
 * @param options 옵션
 * @returns 스케일링된 라인 배열
 */
export function scaleTimeline(
  lines: Line[],
  audioDuration: number,
  options: ScalingOptions = {}
): Line[] {
  const threshold = options.threshold ?? DEFAULT_THRESHOLD;
  const linesWithTime = lines.filter(l => l.startTime !== undefined && l.endTime !== undefined);

  if (linesWithTime.length === 0) {
    return lines;
  }

  // 현재 타임라인의 마지막 endTime
  const lastEndTime = linesWithTime[linesWithTime.length - 1].endTime!;
  
  // 비율 차이 계산
  const ratio = audioDuration / lastEndTime;
  const diff = Math.abs(1 - ratio);

  // 임계값 이하면 보정하지 않음
  if (diff < threshold) {
    return lines;
  }

  // 스케일링 적용
  return lines.map(line => {
    if (line.startTime === undefined || line.endTime === undefined) {
      return line;
    }

      return {
        ...line,
      startTime: line.startTime * ratio,
      endTime: Math.min(line.endTime * ratio, audioDuration),
      };
  });
}
