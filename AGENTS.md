# Agent Development Guide (TapSync Studio)

이 문서는 이 레포지토리를 다루는 **AI Agent (및 개발자)**를 위한 핵심 가이드라인입니다.
현재 프로젝트의 상태는 **MVP**이며, 문서와 실제 구현 간의 정합성을 최우선으로 합니다.

---

## A. Agent Role Definition

당신의 역할은 **UX Correctness(사용자 경험 정합성)**와 **Stability(안정성)**를 지키는 관리자입니다.

1. **UX 우선**: 새로운 기능을 추가하기보다, 현재 존재하는 UX(탭 싱크, 재생)가 끊김 없이 작동하는지 확인하십시오.
2. **구현 존중**: 문서에 있다고 해서 코드를 맹목적으로 구현하지 마십시오. 현재 코드가 특정 기능을 비활성화(예: Scaling Logic)했다면, 그 의도(Manul Control 우선)를 파악해야 합니다.
3. **보수적 리팩토링**: `App.tsx`에 중앙 집중된 로직이 많습니다. 이를 무리하게 분리하면 상태 동기화가 깨질 위험이 크므로 신중해야 합니다.

---

## B. Non-negotiable UX Rules (절대 규칙)

1. **Spacebar = Play/Pause**
   - 이 단축키는 절대 변경되거나 제거될 수 없습니다.
   - 텍스트 입력 중일 때는 예외 처리되어야 합니다.

2. **Sync Workflow 순서**
   - **(1) Start Tap** → **(2) End Tap** → **(3) Next Line**
   - 이 순서는 강제되어야 하며, 중간 단계 건너뛰기는 허용되지 않습니다.

3. **Manual Override First**
   - 사용자가 직접 입력한 타임스탬프는 절대 자동 보정 로직이 임의로 수정해서는 안 됩니다.
   - 현재 `Allocator`와 `Scaler`가 비활성화된 이유입니다.

4. **Layout Stability**
   - 좌측: 자막 리스트 / 우측: 타임라인 (또는 상/하 배치)
   - 이 기본 구조를 크게 흔드는 UI 변경은 금지됩니다.

---

## C. Playback Architecture & UX Safety Rules

### 1. Single Source of Truth (SSOT)
- Playback state must have a single source of truth depending on mode:
  - File Mode: HTMLAudioElement.currentTime and native audio events
  - Timer Mode: startTime + offset (virtual clock)
- UI components must NEVER derive or override playback time independently.

### 2. Seeking Rules (Critical)
- Seeking MUST be performed imperatively via the PlaybackController API:
  - `audioPlayerRef.current.seek(time)`
- React state such as `seekTo` or `setCurrentTime` must NOT be used to control playback time.
- There must be exactly ONE direction of control flow for seek operations.

### 3. Component Responsibilities
- `App.tsx` must NOT manage or derive playback timing state.
- `AudioPlayer.tsx` must act as a thin bridge:
  - forwards commands (play, pause, seek)
  - renders state
  - contains NO timing logic or heuristics.
- All timing logic belongs exclusively to the PlaybackController (`useFileAudio` / `useTimerAudio`).

### 4. Keyboard & UX Safety
- Spacebar is permanently reserved for Play / Pause and cannot be reassigned.
- Marker shortcuts must be user-configurable and conflict-safe.
- Keyboard shortcuts must be ignored when focus is inside input/textarea or during IME composition.

### 5. Anti-Patterns (Explicitly Forbidden)
- No bidirectional state sync between React state and playback time.
- No duplicated timers, intervals, or raf loops controlling currentTime.
- No conditional seek logic scattered across components.

### 6. Documentation Discipline
- Any change to playback behavior or UX flow MUST be reflected in:
  - README.md (user-facing behavior)
  - AGENTS.md (agent constraints)
- Code is the source of truth, but documentation must always be kept in sync.

---

## D. Development Workflow

### 1. UX 변경 검증
모든 UX 변경 시 다음 체크리스트를 통과해야 합니다:
- [ ] 데스크톱(1920px)과 작은 화면(1280px)에서 레이아웃이 깨지지 않는가?
- [ ] Spacebar 재생/일시정지가 포커스 상태와 무관하게(입력창 제외) 잘 작동하는가?
- [ ] 마우스 없이 키보드만으로(현재는 기능 미비, 향후 목표) 작업 가능한 흐름인가?

### 2. PR 및 커밋 가이드
- **UX Intent**: "왜" 이 UX를 변경하는지 명시 (예: "종료 탭 실수 방지")
- **Manual Test**: 어떤 시나리오로 테스트했는지 기재 (예: "오디오 없이 타이머 모드로 3문장 싱크 테스트")

---

## E. What NOT to do (금지 사항)

1. **과도한 UI 라이브러리 도입**
   - 현재 `Mantine`이나 `MUI` 없이 `Tailwind CSS`만으로 가볍게 유지 중입니다. 이를 깨지 마십시오.

2. **헤더/푸터 과부하**
   - 헤더는 'Export', 푸터는 '재생 컨트롤'에 집중해야 합니다. 잡다한 설정 버튼으로 채우지 마십시오.

3. **Export Logic 임의 변경**
   - SRT/LRC/CSV 포맷은 타 시스템(Premiere, CapCut)과 호환되어야 합니다. 공백 처리나 시간 포맷을 임의로 바꾸지 마십시오.

---

## F. How to extend safely

### 1. 키보드 단축키 추가
- 현재 **Marker Shortcut(I/O, Enter 등)**이 구현되어 있지 않습니다.
- 추가 시 `useEffect`를 `App.tsx`나 `BottomControlBar`가 아닌, 별도의 `useHotkeys` 커스텀 훅으로 분리하여 구현하는 것을 권장합니다.

### 2. 새로운 패널/기능
- `HeaderBar`의 `ExportPanel`처럼, 모달(Modal)이나 팝오버 형태로 구현하여 메인 레이아웃을 침범하지 않게 하십시오.

### 3. 상태 관리
- 현재 `App.tsx`가 모든 상태(`lines`, `currentTime`, `isPlaying`)를 들고 있습니다.
- 새로운 상태가 필요하다면, 가능한 `features/` 폴더 내의 로직으로 캡슐화하고 `App.tsx`는 연결만 하도록 설계하십시오.

---

## G. Current Features Status (Code Reality)

문서와 달리 실제 코드는 다음 상태입니다 (2025-12 기준):

- **Sync Logic**:
  - ✅ `MinGap`(최소 간격) 적용됨
  - ✅ `Smoothing`(이동 평균) 적용됨
  - ❌ `Allocator`(길이 기반 분배) **비활성화** (코드에 존재하나 1:1 패스스루)
  - ❌ `Scaler`(비율 보정) **비활성화**
- **Inputs**:
  - ✅ Mouse Click Tap
  - ✅ Spacebar Play
  - ✅ Arrow Seek
  - ❌ **Keyboard Tap (Enter/T) 미구현**

이 상태를 인지하고 작업을 시작하십시오.
