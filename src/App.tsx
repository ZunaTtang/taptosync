import { useState, useEffect, useRef } from 'react';
import { TextInput } from './components/TextInput';
import { AudioPlayer, type AudioPlayerRef } from './components/AudioPlayer';
import { TapButton } from './components/TapButton';
import { TimelineView } from './components/TimelineView';
import { ExportPanel } from './components/ExportPanel';
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
  fetch('http://127.0.0.1:7242/ingest/41a3d5a8-1690-4b8d-ba87-c41877d5e201',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId,hypothesisId,location,message:'lines snapshot',data:{snapshot},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
};

function App() {
  const [lines, setLines] = useState<Line[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [seekTo, setSeekTo] = useState<number | null>(null);
  const [tapMode, setTapMode] = useState<'start' | 'end'>('start');
  const [seekStepSeconds, setSeekStepSeconds] = useState(0.5);
  const [showGuide, setShowGuide] = useState(true);
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
    fetch('http://127.0.0.1:7242/ingest/41a3d5a8-1690-4b8d-ba87-c41877d5e201',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H3',location:'App.tsx:handleStartTap',message:'start tap',data:{actualTime,currentLineIndex,lineId:lines[currentLineIndex]?.id},timestamp:Date.now()})}).catch(()=>{});
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
    fetch('http://127.0.0.1:7242/ingest/41a3d5a8-1690-4b8d-ba87-c41877d5e201',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H4',location:'App.tsx:handleStartTap',message:'after scaling start',data:{lineId:currentLine.id,startTime:scaled[currentLineIndex]?.startTime,endTime:scaled[currentLineIndex]?.endTime,audioDuration},timestamp:Date.now()})}).catch(()=>{});
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
    fetch('http://127.0.0.1:7242/ingest/41a3d5a8-1690-4b8d-ba87-c41877d5e201',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H3',location:'App.tsx:handleEndTap',message:'end tap',data:{actualTime,currentLineIndex,lineId:lines[currentLineIndex]?.id},timestamp:Date.now()})}).catch(()=>{});
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
    fetch('http://127.0.0.1:7242/ingest/41a3d5a8-1690-4b8d-ba87-c41877d5e201',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H4',location:'App.tsx:handleEndTap',message:'after scaling end',data:{lineId:currentLine.id,startTime:scaled[currentLineIndex]?.startTime,endTime:scaled[currentLineIndex]?.endTime,audioDuration},timestamp:Date.now()})}).catch(()=>{});
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
    fetch('http://127.0.0.1:7242/ingest/41a3d5a8-1690-4b8d-ba87-c41877d5e201',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run4',hypothesisId:'H_seek',location:'App.tsx:handleSeekTo',message:'request seek',data:{time},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    setSeekTo(time);
    // 다음 렌더링에서 null로 리셋
    setTimeout(() => setSeekTo(null), 0);
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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">TapSync Studio</h1>
              <span className="section-pill">베타</span>
            </div>
            <p className="text-sm text-gray-600">텍스트 입력 → 재생/탭 → 타임라인 미세조정 → Export 흐름에 맞춰 정리했습니다.</p>
          </div>
          <div className="w-full lg:w-auto">
            <ExportPanel lines={lines} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-6 items-start">
          <div className="space-y-4">
            <div className="card">
              <div className="card-header">
                <div>
                  <p className="card-title">작업 흐름 안내</p>
                  <p className="card-subtitle">텍스트를 준비한 뒤 재생-탭-조정-Export 순서로 진행하세요</p>
                </div>
                <button
                  onClick={() => setShowGuide(prev => !prev)}
                  className="text-sm text-blue-600 hover:text-blue-700 focus-ring rounded-full px-3 py-1"
                  aria-expanded={showGuide}
                >
                  {showGuide ? '접기' : '펼치기'}
                </button>
              </div>
              {showGuide && (
                <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
                  <li>자막 텍스트를 붙여넣어 각 줄을 생성합니다.</li>
                  <li>오디오 파일을 불러오거나 타이머 길이를 입력해 재생합니다.</li>
                  <li>재생 중 시작/종료 탭으로 타임스탬프를 기록합니다.</li>
                  <li>타임라인에서 시간 값을 미세 조정합니다.</li>
                  <li>모든 라인이 채워지면 원하는 포맷으로 Export 합니다.</li>
                </ol>
              )}
            </div>

            <div className="card">
              <TextInput onLinesChange={handleLinesChange} />
            </div>

            <div className="card space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="card-title">재생 & 오디오 설정</p>
                  <p className="text-xs text-gray-500">좌/우 화살표는 아래 간격(초)만큼 이동합니다.</p>
                </div>
                <label className="flex items-center gap-3 text-sm text-gray-700">
                  <span className="font-medium">재생 이동 간격(초)</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={seekStepSeconds}
                    aria-label="재생 이동 간격(초)"
                    onChange={(e) => setSeekStepSeconds(Math.max(0.1, Number(e.target.value) || 0.1))}
                    className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus-ring"
                  />
                </label>
              </div>
              <AudioPlayer
                onTimeUpdate={setCurrentTime}
                onDurationChange={setAudioDuration}
                onPlayingChange={setIsPlaying}
                seekTo={seekTo}
                seekStepSeconds={seekStepSeconds}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="card space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="section-pill">현재 라인</span>
                    <span className="text-sm text-gray-600">{currentLineIndex + 1} / {lines.length || 0}</span>
                  </div>
                  {currentLine && (
                    <p className="text-lg font-semibold text-gray-900 leading-tight">{currentLine.text}</p>
                  )}
                  <p className="text-xs text-gray-500">💡 단축키: ← → (이동) · Space/Enter로 현재 모드 탭</p>
                </div>
                <div className={`text-xs px-3 py-1 rounded-full ${tapMode === 'start' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}`}>
                  {tapMode === 'start' ? '시작 대기' : '종료 대기'}
                </div>
              </div>
              <TapButton
                onStartTap={handleStartTap}
                onEndTap={handleEndTap}
                disabled={!canTap}
                currentMode={tapMode}
              />
            </div>

            <TimelineView
              lines={lines}
              currentTime={currentTime}
              onSeekTo={handleSeekTo}
              onTimeUpdate={handleTimeUpdate}
              onSetMissingTime={handleSetMissingTime}
            />

            <div className="flex justify-end">
              <button
                onClick={handleResetTimestamps}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-200 focus-ring"
              >
                타임스탬프 초기화
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
