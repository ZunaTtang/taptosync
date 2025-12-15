/**
 * Sync Smoothing Processor
 * 인접 간격 튀는 값 완화 처리
 */

import type { Line } from '@/models/line';

export interface SmoothingOptions {
  minGap?: number;      // 최소 간격 (초)
  smoothingWindow?: number; // smoothing 윈도우 크기
}

const DEFAULT_OPTIONS: Required<SmoothingOptions> = {
  minGap: 0.1,
  smoothingWindow: 3,
};

/**
 * startTime의 monotonic 보장 및 최소 간격 적용
 * @param lines 라인 배열
 * @param options 옵션
 * @returns 보정된 라인 배열
 */
export function applyMinGap(
  lines: Line[],
  options: SmoothingOptions = {}
): Line[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const result: Line[] = [];
  let lastTime = 0;

  for (const line of lines) {
    if (line.startTime === undefined) {
      result.push(line);
      continue;
    }

    const adjustedTime = Math.max(line.startTime, lastTime + opts.minGap);
    result.push({ ...line, startTime: adjustedTime });
    lastTime = adjustedTime;
  }

  return result;
}

/**
 * 인접 간격을 smoothing 처리
 * @param lines 라인 배열
 * @param options 옵션
 * @returns smoothing된 라인 배열
 */
export function smoothIntervals(
  lines: Line[],
  options: SmoothingOptions = {}
): Line[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const linesWithTime = lines.filter(l => l.startTime !== undefined);
  
  if (linesWithTime.length < 2) {
    return lines;
  }

  // 간격 계산
  const intervals: number[] = [];
  for (let i = 1; i < linesWithTime.length; i++) {
    const prev = linesWithTime[i - 1].startTime!;
    const curr = linesWithTime[i].startTime!;
    intervals.push(curr - prev);
  }

  // Moving average로 smoothing
  const smoothedIntervals: number[] = [];
  for (let i = 0; i < intervals.length; i++) {
    const start = Math.max(0, i - Math.floor(opts.smoothingWindow / 2));
    const end = Math.min(intervals.length, i + Math.ceil(opts.smoothingWindow / 2));
    const window = intervals.slice(start, end);
    const avg = window.reduce((a, b) => a + b, 0) / window.length;
    smoothedIntervals.push(Math.max(avg, opts.minGap));
  }

  // 보정된 시간으로 재구성
  const result: Line[] = [];
  let currentTime = linesWithTime[0].startTime!;
  let intervalIndex = 0;

  for (const line of lines) {
    if (line.startTime === undefined) {
      result.push(line);
      continue;
    }

    if (result.length === 0) {
      result.push({ ...line, startTime: currentTime });
    } else {
      currentTime += smoothedIntervals[intervalIndex];
      result.push({ ...line, startTime: currentTime });
      intervalIndex++;
    }
  }

  return result;
}
