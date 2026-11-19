/**
 * 텍스트를 정리하고 줄 단위로 분리하는 유틸리티 함수
 */

import type { Line } from '@/models/line';

/**
 * 텍스트를 정리하고 줄 단위로 분리
 * @param rawText 원본 텍스트
 * @returns 정리된 줄 배열
 */
export function processText(rawText: string): string[] {
  return rawText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

/**
 * 텍스트를 Line 객체 배열로 변환
 * @param rawText 원본 텍스트
 * @returns Line 객체 배열
 */
export function textToLines(rawText: string): Line[] {
  const processedLines = processText(rawText);
  return processedLines.map((text, index) => ({
    id: `line-${index + 1}`,
    rawText: text,
    text: text,
    order: index + 1,
  }));
}
