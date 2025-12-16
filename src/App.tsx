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

  // 스페이스바를 재생 제어 대신 마커 입력으로 사용
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (!canTap) return;
        if (tapMode === 'start') {
          handleStartTap();
        } else {
          handleEndTap();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [canTap, tapMode, handleStartTap, handleEndTap]);

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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">TapSync Studio</h1>
            <p className="text-sm text-gray-600 mb-4">타임스탬프를 빠르게 찍고 직접 편집하세요</p>

            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-semibold text-gray-900">작업 흐름 안내</p>
                <span className="text-xs text-gray-500 border border-gray-200 rounded-full w-5 h-5 flex items-center justify-center cursor-help" title="1) 자막 텍스트를 붙여넣고, 2) 오디오를 연결해 재생한 뒤, 3) 스페이스바 또는 탭 버튼으로 시작/종료 마커를 찍고, 4) 타임라인에서 미세 조정 후 Export로 내보내세요.">?</span>
              </div>
              <ul className="text-sm text-gray-700 list-disc pl-4 space-y-1">
                <li>텍스트 붙여넣기 → 각 줄이 한 개의 자막이 됩니다.</li>
                <li>오디오/타이머 준비 → 재생 시작 후 스페이스바로 마커 입력.</li>
                <li>타임라인에서 시간 값을 클릭하거나 직접 입력해 미세 조정.</li>
                <li>상단 Export 패널에서 바로 SRT/LRC/CSV로 저장.</li>
              </ul>
            </div>
          </div>

          <div className="w-full lg:w-80">
            <div className="sticky top-6 bg-white border border-gray-200 rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-900">Export</h2>
                <span className="text-xs text-gray-500 border border-gray-200 rounded-full w-5 h-5 flex items-center justify-center cursor-help" title="타임라인에 시작/종료 시간이 모두 채워진 후 바로 SRT, LRC, CapCut CSV를 다운로드할 수 있습니다.">?</span>
              </div>
              <ExportPanel lines={lines} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 좌측: 텍스트 입력 */}
          <div className="space-y-4">
            <TextInput onLinesChange={handleLinesChange} />
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <label className="font-medium flex items-center gap-2">
                재생 이동 간격(초)
                <span className="text-[10px] text-gray-500 border border-gray-200 rounded-full w-4 h-4 flex items-center justify-center cursor-help" title="좌/우 화살표 키로 재생 헤드를 이동할 때 사용되는 기본 간격입니다.">?</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={seekStepSeconds}
                onChange={(e) => setSeekStepSeconds(Math.max(0.1, Number(e.target.value) || 0.1))}
                className="w-24 px-2 py-1 border border-gray-300 rounded"
              />
              <span className="text-xs text-gray-500">좌/우 화살표로 적용</span>
            </div>
            <AudioPlayer
              onTimeUpdate={setCurrentTime}
              onDurationChange={setAudioDuration}
              onPlayingChange={setIsPlaying}
              seekTo={seekTo}
              seekStepSeconds={seekStepSeconds}
            />
          </div>

          {/* 우측: Tap 버튼 및 타임라인 */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="mb-4 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">현재 라인: {currentLineIndex + 1} / {lines.length}</p>
                  <span className="text-[10px] text-gray-500 border border-gray-200 rounded-full w-4 h-4 flex items-center justify-center cursor-help" title="시작/종료 마커는 스페이스바 또는 아래 탭 버튼으로 찍을 수 있습니다. 오디오가 재생 중일 때만 기록됩니다.">?</span>
                </div>
                {currentLine && (
                  <p className="text-lg font-medium text-gray-900">{currentLine.text}</p>
                )}
                <p className="text-xs text-gray-500">💡 단축키: 스페이스바(마커), ←/→ (재생 헤드 이동)</p>
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
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                타임스탬프 초기화
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
