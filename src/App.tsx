import { useState, useEffect, useRef, useCallback } from 'react';
import { TextInput } from './components/TextInput';
import { AudioPlayer, type AudioPlayerRef } from './components/AudioPlayer';
import { TimelineView } from './components/TimelineView';
import { HeaderBar } from './components/HeaderBar';
import { BottomControlBar } from './components/BottomControlBar';
import { ShortcutSettingsModal, type ShortcutConfig } from './components/ShortcutSettingsModal';
import { getNextLineId } from './features/sync/collector';
import { applyMinGap, smoothIntervals } from './features/sync/smoother';
import { allocateEndTimes } from './features/sync/allocator';
import type { Line } from './models/line';

const logLines = (location: string, runId: string, hypothesisId: string, linesSnapshot: Line[]) => {
  const snapshot = linesSnapshot.map((l) => ({
    id: l.id,
    start: l.startTime,
    end: l.endTime,
    order: l.order,
  }));
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/41a3d5a8-1690-4b8d-ba87-c41877d5e201', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: 'debug-session', runId, hypothesisId, location, message: 'lines snapshot', data: { snapshot }, timestamp: Date.now() }) }).catch(() => { });
  // #endregion
};

function App() {
  const [lines, setLines] = useState<Line[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  // const [seekTo, setSeekTo] = useState<number | null>(null); // Removed legacy seeking state
  const [tapMode, setTapMode] = useState<'start' | 'end'>('start');
  const [seekStepSeconds, setSeekStepSeconds] = useState(0.5);
  const [isLyricsOpen, setIsLyricsOpen] = useState(true);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [shortcutConfig, setShortcutConfig] = useState<ShortcutConfig>({ start: 'i', end: 'o', next: 'ArrowDown' });
  const [isShortcutModalOpen, setIsShortcutModalOpen] = useState(false);
  const isComposingRef = useRef(false);
  const audioPlayerRef = useRef<AudioPlayerRef>(null);

  const isBlockedShortcut = (key?: string) => {
    if (!key) return false;
    const lower = key.toLowerCase();
    return lower === ' ' || lower === 'space' || lower === 'spacebar';
  };

  // 단축키 초기화 및 저장
  useEffect(() => {
    try {
      const stored = localStorage.getItem('taptosync-shortcuts');
      if (stored) {
        const parsed = JSON.parse(stored) as ShortcutConfig;
        const validStart = parsed.start && !isBlockedShortcut(parsed.start);
        const validEnd = parsed.end && !isBlockedShortcut(parsed.end) && parsed.start !== parsed.end;
        let nextKey = parsed.next;
        if (nextKey && (isBlockedShortcut(nextKey) || nextKey.toLowerCase() === parsed.start?.toLowerCase() || nextKey.toLowerCase() === parsed.end?.toLowerCase())) {
          nextKey = 'ArrowDown';
        }
        if (validStart && validEnd) {
          setShortcutConfig({ start: parsed.start, end: parsed.end, next: nextKey || 'ArrowDown' });
        }
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('taptosync-shortcuts', JSON.stringify(shortcutConfig));
  }, [shortcutConfig]);

  // 전체 타임스탬프 초기화
  const handleResetTimestamps = () => {
    const cleared = lines.map(line => ({
      ...line,
      startTime: undefined,
      endTime: undefined,
    }));
    setLines(cleared);
    setCurrentLineIndex(0);
    setTapMode('start');
  };

  // 시작 탭 버튼 클릭 시
  const handleStartTap = () => {
    if (currentLineIndex >= lines.length || !isPlaying || audioDuration <= 0) return;

    // 오디오의 실제 currentTime을 직접 가져옴 (상태보다 정확)
    const actualTime = audioPlayerRef.current?.getCurrentTime() ?? currentTime;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/41a3d5a8-1690-4b8d-ba87-c41877d5e201', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: 'debug-session', runId: 'run1', hypothesisId: 'H3', location: 'App.tsx:handleStartTap', message: 'start tap', data: { actualTime, currentLineIndex, lineId: lines[currentLineIndex]?.id }, timestamp: Date.now() }) }).catch(() => { });
    // #endregion
    const currentLine = lines[currentLineIndex];
    const updatedLines = lines.map(line =>
      line.id === currentLine.id
        ? { ...line, startTime: actualTime, endTime: undefined } // 시작 시 end 초기화
        : line
    );
    logLines('App.tsx:handleStartTap:setTimestamp', 'run2', 'H5', updatedLines);

    // 보정 적용
    const withMinGap = applyMinGap(updatedLines);
    logLines('App.tsx:handleStartTap:applyMinGap', 'run2', 'H5', withMinGap);
    const smoothed = smoothIntervals(withMinGap);
    logLines('App.tsx:handleStartTap:smoothIntervals', 'run2', 'H5', smoothed);
    const withEndTimes = allocateEndTimes(smoothed, audioDuration);
    logLines('App.tsx:handleStartTap:allocateEndTimes', 'run2', 'H5', withEndTimes);
    // 스케일링 미적용: 수동 입력 타임스탬프 보존
    const scaled = withEndTimes;
    logLines('App.tsx:handleStartTap:skipScale', 'run2', 'H5', scaled);

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/41a3d5a8-1690-4b8d-ba87-c41877d5e201', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: 'debug-session', runId: 'run1', hypothesisId: 'H4', location: 'App.tsx:handleStartTap', message: 'after scaling start', data: { lineId: currentLine.id, startTime: scaled[currentLineIndex]?.startTime, endTime: scaled[currentLineIndex]?.endTime, audioDuration }, timestamp: Date.now() }) }).catch(() => { });
    // #endregion
    setLines(scaled);
    setTapMode('end'); // 종료 탭 모드로 전환
  };

  // 종료 탭 버튼 클릭 시
  const handleEndTap = () => {
    if (currentLineIndex >= lines.length || !isPlaying || audioDuration <= 0) return;

    // 오디오의 실제 currentTime을 직접 가져옴 (상태보다 정확)
    const actualTime = audioPlayerRef.current?.getCurrentTime() ?? currentTime;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/41a3d5a8-1690-4b8d-ba87-c41877d5e201', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: 'debug-session', runId: 'run1', hypothesisId: 'H3', location: 'App.tsx:handleEndTap', message: 'end tap', data: { actualTime, currentLineIndex, lineId: lines[currentLineIndex]?.id }, timestamp: Date.now() }) }).catch(() => { });
    // #endregion
    const currentLine = lines[currentLineIndex];
    // 종료 시간 설정 (시작 값 유지)
    const updatedLines = lines.map((line) => {
      if (line.id === currentLine.id) {
        return { ...line, endTime: actualTime };
      }
      return line;
    });

    // 보정 적용
    const withMinGap = applyMinGap(updatedLines);
    const smoothed = smoothIntervals(withMinGap);
    const withEndTimes = allocateEndTimes(smoothed, audioDuration);
    // 스케일링 미적용: 수동 입력 타임스탬프 보존
    const scaled = withEndTimes;
    logLines('App.tsx:handleEndTap:skipScale', 'run2', 'H5', scaled);

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/41a3d5a8-1690-4b8d-ba87-c41877d5e201', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: 'debug-session', runId: 'run1', hypothesisId: 'H4', location: 'App.tsx:handleEndTap', message: 'after scaling end', data: { lineId: currentLine.id, startTime: scaled[currentLineIndex]?.startTime, endTime: scaled[currentLineIndex]?.endTime, audioDuration }, timestamp: Date.now() }) }).catch(() => { });
    // #endregion
    setLines(scaled);

    // 다음 라인으로 이동하고 시작 탭 모드로 전환
    const nextId = getNextLineId(scaled, currentLine.order);
    if (nextId) {
      const nextIndex = scaled.findIndex(l => l.id === nextId);
      setCurrentLineIndex(nextIndex);
    } else {
      setCurrentLineIndex(currentLineIndex + 1);
    }
    setTapMode('start');
  };

  // 텍스트 변경 시 라인 업데이트 및 인덱스 리셋
  const handleLinesChange = (newLines: Line[]) => {
    setLines(newLines);
    setCurrentLineIndex(0);
    setTapMode('start'); // 시작 탭 모드로 리셋
  };

  // 현재 포커스된 라인 하이라이트를 위한 효과
  useEffect(() => {
    // 스크롤을 현재 라인으로 이동하는 로직은 필요시 추가
  }, [currentLineIndex]);

  // 타임라인에서 시간 수정
  const handleTimeUpdate = (lineId: string, time: 'start' | 'end', newTime: number) => {
    setLines((prevLines) => {
      const updated = prevLines.map((line) => {
        if (line.id === lineId) {
          if (time === 'start') {
            return { ...line, startTime: newTime };
          } else {
            return { ...line, endTime: newTime };
          }
        }
        return line;
      });

      // 보정 적용
      const withMinGap = applyMinGap(updated);
      const smoothed = smoothIntervals(withMinGap);
      const withEndTimes = allocateEndTimes(smoothed, audioDuration);
      return withEndTimes; // scaleTimeline 생략
    });
  };

  // 타임라인 클릭 시 재생 위치 이동
  const handleSeekTo = (time: number) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/41a3d5a8-1690-4b8d-ba87-c41877d5e201', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: 'debug-session', runId: 'run4', hypothesisId: 'H_seek', location: 'App.tsx:handleSeekTo', message: 'request seek', data: { time }, timestamp: Date.now() }) }).catch(() => { });
    // #endregion

    // Imperative seek via ref (SSOT Rule #2)
    audioPlayerRef.current?.seek(time);
  };

  const currentLine = lines[currentLineIndex];
  const canTap = currentLine !== undefined && audioDuration > 0 && isPlaying;

  // 기록 없는 라인을 현재 재생 시점으로 자동 기록
  const handleSetMissingTime = (lineId: string, fallbackTime: number) => {
    const actualTime = audioPlayerRef.current?.getCurrentTime() ?? fallbackTime;
    const updated = lines.map(line => {
      if (line.id !== lineId) return line;
      if (line.startTime === undefined && line.endTime === undefined) {
        return { ...line, startTime: actualTime };
      }
      return line;
    });

    const withMinGap = applyMinGap(updated);
    const smoothed = smoothIntervals(withMinGap);
    const withEndTimes = allocateEndTimes(smoothed, audioDuration);
    const scaled = withEndTimes; // scaleTimeline 생략 (수동값 보존)
    setLines(scaled);
    setTapMode('end');
  };

  const handleTogglePlay = useCallback(() => {
    audioPlayerRef.current?.togglePlay();
  }, []);

  useEffect(() => {
    const handleCompositionStart = () => {
      isComposingRef.current = true;
    };
    const handleCompositionEnd = () => {
      isComposingRef.current = false;
    };

    window.addEventListener('compositionstart', handleCompositionStart);
    window.addEventListener('compositionend', handleCompositionEnd);

    return () => {
      window.removeEventListener('compositionstart', handleCompositionStart);
      window.removeEventListener('compositionend', handleCompositionEnd);
    };
  }, []);

  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditableInput =
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLInputElement &&
          ['text', 'search', 'url', 'tel', 'email', 'password', 'number'].includes(target.type)) ||
        target instanceof HTMLSelectElement ||
        target?.getAttribute('contenteditable') === 'true';

      if (isEditableInput || isComposingRef.current || isShortcutModalOpen) return;

      const lowerKey = e.key.toLowerCase();

      if (lowerKey === ' ' || lowerKey === 'spacebar') {
        e.preventDefault();
        handleTogglePlay();
        return;
      }

      if (lowerKey === shortcutConfig.start.toLowerCase()) {
        e.preventDefault();
        handleStartTap();
        return;
      }

      if (lowerKey === shortcutConfig.end.toLowerCase()) {
        e.preventDefault();
        handleEndTap();
        return;
      }

      if (shortcutConfig.next && lowerKey === shortcutConfig.next.toLowerCase()) {
        e.preventDefault();
        setCurrentLineIndex((prev) => Math.min(prev + 1, Math.max(lines.length - 1, 0)));
        setTapMode('start');
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [handleTogglePlay, shortcutConfig, handleStartTap, handleEndTap, isShortcutModalOpen, lines.length]);

  const handleJumpToCurrentLine = () => {
    const active = lines[currentLineIndex];
    if (active?.startTime !== undefined) {
      handleSeekTo(active.startTime);
    }
  };

  const contentPaddingBottom = 'calc(var(--bottom-bar-height) + 32px)';
  const contentPaddingTop = 'calc(var(--header-height) + 12px)';
  const currentStatusLabel = (() => {
    if (!currentLine) return '대기 중';
    if (currentLine.startTime === undefined) return '시작 대기';
    if (currentLine.endTime === undefined) return '종료 대기';
    return '완료';
  })();

  return (
    <div className="min-h-screen bg-[color:var(--color-surface)] flex flex-col">
      <HeaderBar lines={lines} />
      <main className="flex-1 overflow-y-auto" style={{ paddingTop: contentPaddingTop }}>
        <div className="app-container mx-auto px-4" style={{ paddingBottom: contentPaddingBottom }}>
          <div className="space-y-5">
            <div className="app-card py-3 px-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">작업 흐름</span>
                  <span className="text-gray-600">텍스트 → 탭 → 타임라인 보정 → Export</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGuideOpen(!isGuideOpen)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-expanded={isGuideOpen}
                >
                  {isGuideOpen ? '접기' : '펼치기'}
                </button>
              </div>
              {isGuideOpen ? (
                <ol className="mt-3 space-y-2 text-sm text-gray-700 list-decimal list-inside">
                  <li>재생/오디오를 먼저 설정하고 간격을 확인합니다.</li>
                  <li>재생 중 <span className="font-semibold text-blue-700">시작</span> → <span className="font-semibold text-rose-700">종료</span> 순서로 마커를 찍습니다.</li>
                  <li>타임라인에서 누락/오류를 바로 수정하고 Export를 진행합니다.</li>
                </ol>
              ) : (
                <p className="mt-2 text-xs text-gray-500">필요할 때만 펼쳐서 참고하세요.</p>
              )}
            </div>

            <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
              <section className="order-1 space-y-6 lg:col-start-1 lg:row-start-1">
                <div className="app-card space-y-4">
                  <div className="section-header">
                    <div>
                      <p className="section-title">재생 · 오디오 설정</p>
                      <p className="section-sub text-sm">필수 설정을 상단에 모아둔 간결한 영역</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsShortcutModalOpen(true)}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        단축키 설정
                      </button>
                      <span className="px-3 py-1 text-xs rounded-full bg-purple-50 text-purple-700 border border-purple-100">← → 이동</span>
                    </div>
                  </div>
                  <div className="form-row">
                    <label className="text-sm font-semibold text-gray-800">재생 이동 간격(초)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={seekStepSeconds}
                        onChange={(e) => setSeekStepSeconds(Math.max(0.1, Number(e.target.value) || 0.1))}
                        className="w-28 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="재생 이동 간격"
                      />
                      <span className="text-xs text-gray-500">← →, PageUp/Down 키와 연동</span>
                    </div>
                  </div>
                  <div className="form-row">
                    <label className="text-sm font-semibold text-gray-800">오디오 소스</label>
                    <div className="flex items-center gap-3">
                      <AudioPlayer
                        ref={audioPlayerRef}
                        onTimeUpdate={setCurrentTime}
                        onDurationChange={setAudioDuration}
                        onPlayingChange={setIsPlaying}
                        // seekTo={seekTo} // Legacy prop removed
                        seekStepSeconds={seekStepSeconds}
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </section>

        <section className="order-2 space-y-6 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-[calc(var(--header-height)+12px)]">
          <div className="app-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="section-title">현재 라인</p>
                <p className="text-xs text-gray-600">{currentLine ? '라인 상태와 단축키를 한곳에 표시' : '텍스트를 입력하면 라인이 생성됩니다.'}</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">{currentLineIndex + 1} / {lines.length || 0}</span>
                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">{currentStatusLabel}</span>
              </div>
            </div>
            {currentLine ? (
              <div className="space-y-3">
                <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                  <div className="flex items-center justify-between gap-2 text-xs text-gray-600">
                    <span className="font-semibold text-gray-800">#{currentLine.order}</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full border ${currentLine.startTime !== undefined ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        시작 {currentLine.startTime !== undefined ? '기록됨' : '대기'}
                      </span>
                      <span className={`px-2 py-1 rounded-full border ${currentLine.endTime !== undefined ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        종료 {currentLine.endTime !== undefined ? '기록됨' : '대기'}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-gray-800 truncate" title={currentLine.text}>{currentLine.text}</p>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleStartTap}
                    disabled={!canTap}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="시작 마커 찍기"
                  >
                    <span aria-hidden>▶</span>
                    시작 마커
                  </button>
                  <button
                    type="button"
                    onClick={handleEndTap}
                    disabled={!canTap}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="종료 마커 찍기"
                  >
                    <span aria-hidden>⏹</span>
                    종료 마커
                  </button>
                </div>
                <p className="text-xs text-gray-600">Start ({shortcutConfig.start || 'I'}) / End ({shortcutConfig.end || 'O'}) / Play (Space)</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">텍스트를 입력하고 오디오를 설정하면 라인이 표시됩니다.</p>
            )}
          </div>
        </section>

        <section className="order-3 space-y-6 lg:col-start-1 lg:row-start-2">
          <div className="app-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="section-title">자막 텍스트 입력</p>
                <p className="section-sub">각 줄이 한 개의 자막 라인이 됩니다. 필요시 접어두세요.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">총 {lines.length}라인</span>
                <button
                  type="button"
                  onClick={() => setIsLyricsOpen(!isLyricsOpen)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-expanded={isLyricsOpen}
                >
                  {isLyricsOpen ? '접기' : '펼치기'}
                </button>
              </div>
            </div>
            {isLyricsOpen && <TextInput onLinesChange={handleLinesChange} labelHidden />}
          </div>
        </section>

        <section className="order-4 space-y-6 lg:col-start-2 lg:row-start-2">
          <TimelineView
            lines={lines}
            currentTime={currentTime}
            onSeekTo={handleSeekTo}
            onTimeUpdate={handleTimeUpdate}
            onSetMissingTime={handleSetMissingTime}
            currentLineIndex={currentLineIndex}
            totalLines={lines.length}
            onJumpToCurrent={handleJumpToCurrentLine}
            headerAction={
              <button
                onClick={handleResetTimestamps}
                className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                타임스탬프 초기화
              </button>
            }
          />
        </section>
    </div>
        </div >
      </main >

    <BottomControlBar
      currentTime={currentTime}
      duration={audioDuration}
      isPlaying={isPlaying}
      onTogglePlay={handleTogglePlay}
      onSeek={handleSeekTo}
      onStartTap={handleStartTap}
      onEndTap={handleEndTap}
      tapMode={tapMode}
      currentLineIndex={currentLineIndex}
      totalLines={lines.length}
      currentLine={currentLine}
      tapDisabled={!canTap}
    />

  {
    isShortcutModalOpen && (
      <ShortcutSettingsModal
        initialConfig={shortcutConfig}
        onSave={setShortcutConfig}
        onClose={() => setIsShortcutModalOpen(false)}
      />
    )
  }
    </div >
  );
}

export default App;
