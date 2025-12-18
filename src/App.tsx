import { useState, useEffect, useRef, useCallback } from 'react';
import { TextInput } from './components/TextInput';
import { AudioPlayer, type AudioPlayerRef } from './components/AudioPlayer';
import { TimelineView } from './components/TimelineView';
import { HeaderBar } from './components/HeaderBar';
import { BottomControlBar } from './components/BottomControlBar';
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
  const audioPlayerRef = useRef<AudioPlayerRef>(null);

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
    if (currentLineIndex >= lines.length) return;

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
    if (currentLineIndex >= lines.length) return;

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
    const handleSpaceToggle = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditableInput =
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLInputElement &&
          ['text', 'search', 'url', 'tel', 'email', 'password', 'number'].includes(target.type)) ||
        target?.getAttribute('contenteditable') === 'true';

      if (isEditableInput) return;

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        handleTogglePlay();
      }
    };

    window.addEventListener('keydown', handleSpaceToggle);
    return () => {
      window.removeEventListener('keydown', handleSpaceToggle);
    };
  }, [handleTogglePlay]);

  const handleJumpToCurrentLine = () => {
    const active = lines[currentLineIndex];
    if (active?.startTime !== undefined) {
      handleSeekTo(active.startTime);
    }
  };

  const contentPaddingBottom = 'calc(var(--bottom-bar-height) + 28px)';
  const contentPaddingTop = 'calc(var(--header-height) + 8px)';

  return (
    <div className="min-h-screen bg-[color:var(--color-surface)] flex flex-col">
      <HeaderBar lines={lines} />
      <main className="flex-1 overflow-y-auto" style={{ paddingTop: contentPaddingTop }}>
        <div className="app-container mx-auto px-4" style={{ paddingBottom: contentPaddingBottom }}>
          <div className="space-y-5">
            <div className="app-card">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="section-title">작업 흐름 안내</p>
                  <p className="section-sub text-sm text-gray-600">필요할 때만 펼쳐보세요.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGuideOpen(!isGuideOpen)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-expanded={isGuideOpen}
                >
                  {isGuideOpen ? '접기' : '자세히 보기'}
                </button>
              </div>
              {isGuideOpen && (
                <ol className="mt-3 space-y-2 text-sm text-gray-700 list-decimal list-inside">
                  <li>자막 텍스트를 붙여넣으면 자동으로 줄 단위 라인이 생성됩니다.</li>
                  <li>오디오 소스를 선택하고 화살표(← →)로 미세 이동합니다.</li>
                  <li>재생 중 <span className="font-semibold text-blue-700">시작 탭</span> → <span className="font-semibold text-rose-700">종료 탭</span> 순서로 타임스탬프를 기록합니다.</li>
                  <li>타임라인에서 시간을 직접 수정하거나 누락된 라인을 클릭해 보완하세요.</li>
                  <li>모든 라인이 채워지면 상단 Export에서 SRT/LRC/CSV를 내려받습니다.</li>
                </ol>
              )}
            </div>

            <div className="app-card space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="section-title">자막 텍스트 입력</p>
                  <p className="section-sub">각 줄이 한 개의 자막 라인이 됩니다. 필요시 접어두고 타임라인을 확장하세요.</p>
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

            <div className="app-card space-y-4">
              <div className="section-header">
                <div>
                  <p className="section-title">재생 · 오디오 설정</p>
                  <p className="section-sub">탭 속도를 끌어올릴 수 있도록 이동 간격과 오디오 소스를 한곳에서 설정합니다.</p>
                </div>
                <span className="px-3 py-1 text-xs rounded-full bg-purple-50 text-purple-700 border border-purple-100">단축키: ← →</span>
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
                    className="w-28 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    aria-label="재생 이동 간격 (초)"
                  />
                  <span className="text-xs text-gray-500">좌/우 화살표로 적용</span>
                </div>
              </div>
              <div className="border-t border-dashed border-gray-200 pt-4">
                <AudioPlayer
                  ref={audioPlayerRef}
                  onTimeUpdate={setCurrentTime}
                  onDurationChange={setAudioDuration}
                  onPlayingChange={setIsPlaying}

                  seekStepSeconds={seekStepSeconds}
                />
              </div>
            </div>

            <div className="app-card space-y-3">
              <div className="section-header">
                <div className="space-y-1">
                  <p className="section-title">현재 라인</p>
                  <p className="text-xs text-gray-500">텍스트 확인과 상태 체크는 이곳에서, 탭은 하단 고정 컨트롤에서 수행하세요.</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">{currentLineIndex + 1} / {lines.length}</span>
                  <span className={`px-3 py-1 rounded-full border text-xs ${tapMode === 'start' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                    {tapMode === 'start' ? '시작 대기' : '종료 대기'}
                  </span>
                </div>
              </div>
              {currentLine ? (
                <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="text-sm font-semibold text-gray-800 truncate">{currentLine.text}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className={`px-2 py-1 rounded-full border ${currentLine.startTime !== undefined ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                      시작 {currentLine.startTime !== undefined ? '기록됨' : '대기'}
                    </span>
                    <span className={`px-2 py-1 rounded-full border ${currentLine.endTime !== undefined ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                      종료 {currentLine.endTime !== undefined ? '기록됨' : '대기'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">텍스트를 입력하고 오디오를 설정하면 라인이 표시됩니다.</p>
              )}
            </div>

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
          </div>
        </div>
      </main>

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
    </div>
  );
}

export default App;
