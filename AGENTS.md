# 숏폼 편집자 싱크 자동화 MVP - Agent 작업 스펙

## 프로젝트 목표

숏폼 편집자가 자막 싱크 작업을 **Tap 기반 UX + 자동 보정 엔진**으로 크게 단축하는 Web MVP를 구축합니다.

## 핵심 기능

- **Tap-to-Sync**: 재생 중 문장 시작에 탭해서 timestamp 등록
- **자동 보정**: smoothing, scaling, 길이 기반 분배
- **Export 3종**: SRT, LRC, CapCut CSV

## 기술 스택

- **프론트엔드**: React + Vite + Tailwind CSS (TypeScript)
- **테스트**: Vitest (권장)
- **외부 라이브러리**: 최소화 (필수 아니면 추가하지 않기)

## 아키텍처 모듈

### Sync Engine (`/src/features/sync/*`)
- **Tap Timestamp Collector**: Tap 입력으로 timestamp 수집
- **Sync Smoothing Processor**: 인접 간격 튀는 값 완화
- **Length-based Weight Allocator**: 문장 길이에 따른 endTime 분배
- **Timeline Scaling Module**: 전체 길이 비율 보정

### Export Modules (`/src/features/export/*`)
- **SRTFormatter**: SRT 자막 포맷
- **LRCFormatter**: LRC 자막 포맷
- **CapCutCSVFormatter**: CapCut CSV 포맷

## 개발 우선순위

1. **텍스트 입력·정리** - 텍스트 붙여넣기 및 자동 줄 분리
2. **오디오 재생** - 오디오 파일 업로드 및 재생 컨트롤
3. **Tap-to-Sync 입력** - Tap 버튼으로 timestamp 등록
4. **보정 알고리즘 MVP** - smoothing, scaling, 길이 기반 분배
5. **SRT/CSV/LRC Export** - 3종 포맷 export 구현
6. **UX polishing** - 하이라이트, 타임라인 편집, 예외 처리

### 후순위 기능
- Drag Sync
- Waveform UI
- AI alignment

## 폴더 구조

```
/
├── .cursor/
│   └── rules              # Cursor 프로젝트 규칙
├── src/
│   ├── features/
│   │   ├── sync/          # Sync Engine 모듈
│   │   │   ├── collector.ts
│   │   │   ├── smoother.ts
│   │   │   ├── allocator.ts
│   │   │   └── scaler.ts
│   │   └── export/        # Export 모듈
│   │       ├── srt.ts
│   │       ├── lrc.ts
│   │       └── capcut-csv.ts
│   ├── models/            # 도메인 모델
│   │   └── line.ts        # Line 모델 정의
│   ├── utils/             # 유틸리티 함수
│   │   └── text-processor.ts  # 텍스트 정리 로직
│   ├── components/        # React 컴포넌트
│   │   ├── TextInput.tsx
│   │   ├── AudioPlayer.tsx
│   │   ├── TapButton.tsx
│   │   ├── TimelineView.tsx
│   │   └── ExportPanel.tsx
│   ├── App.tsx
│   └── main.tsx
├── tests/                 # 테스트 파일
│   ├── sync/
│   ├── export/
│   └── utils/
├── AGENTS.md              # 이 파일
├── README.md
└── package.json
```

## 코딩 규칙

### TypeScript
- 모든 새 파일은 TypeScript로 작성
- 타입 명시적 정의 (any 지양)
- 인터페이스/타입은 `models/` 또는 각 모듈 내부에 정의

### React
- 함수형 컴포넌트 사용
- Hooks 활용 (useState, useEffect, useRef 등)
- Props 타입 명시

### 모듈 설계
- **순수 함수 중심**: 테스트 가능하게 작성
- **단일 책임 원칙**: 각 모듈은 명확한 역할
- **의존성 최소화**: 외부 라이브러리 최소 사용

### 테스트
- 핵심 로직(Sync Engine, Export Modules, 텍스트 처리)에 단위 테스트 작성
- Vitest 사용 (권장)
- 테스트 파일은 `tests/` 또는 각 모듈 옆에 `*.test.ts` 형태

### 코드 스타일
- 2 spaces 들여쓰기
- 세미콜론 사용
- 파일명: kebab-case (컴포넌트는 PascalCase)
- 함수명: camelCase

## 작업 방식

1. **작은 단위로 나눠서** 변경
2. 각 단계마다 빌드/테스트가 깨지지 않게 유지
3. 중요한 설계/결정(시간 포맷, CSV 스키마, 보정 규칙)을 문서화
4. 터미널 실행 불가 시 명령어를 정확히 제시

## 도메인 모델

### Line (자막 한 줄)
```typescript
interface Line {
  id: string;           // 고유 ID
  rawText: string;      // 원본 텍스트
  text: string;         // 정리된 텍스트
  order: number;        // 순서
  startTime?: number;   // 시작 시간 (초)
  endTime?: number;     // 종료 시간 (초)
}
```

## 보정 알고리즘 규칙 (MVP)

1. **startTime monotonic 보장**: 역전 방지
2. **최소 간격(minGap) 적용**: 너무 가까운 시간 방지
3. **smoothing**: 인접 간격 튀는 값 완화 (moving average 또는 clamp)
4. **길이 기반 분배**: 문장 길이(문자수)에 따라 endTime 자연스럽게 배분
5. **scaling**: 전체 길이가 audioDuration과 크게 어긋나면 비율 보정 (옵션)

## Export 포맷 스펙

### SRT
```
1
00:00:01,000 --> 00:00:03,500
첫 번째 자막

2
00:00:03,500 --> 00:00:06,200
두 번째 자막
```

### LRC
```
[00:01.00]첫 번째 자막
[00:03.50]두 번째 자막
```

### CapCut CSV
컬럼: `start,end,text`
- 시간 포맷: 초 단위 (예: 1.0, 3.5)
- CSV quote/escape 처리 필수
