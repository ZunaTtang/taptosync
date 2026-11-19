export interface Line {
  id: string;           // 고유 ID
  rawText: string;      // 원본 텍스트
  text: string;         // 정리된 텍스트
  order: number;        // 순서
  startTime?: number;   // 시작 시간 (초)
  endTime?: number;     // 종료 시간 (초)
}

