import { useState, useRef, useEffect, type ReactNode } from 'react';
import type { Line } from '@/models/line';

interface TimelineViewProps {
  lines: Line[];
  currentTime?: number;
  onSeekTo?: (time: number) => void;
  onTimeUpdate?: (lineId: string, time: 'start' | 'end', newTime: number) => void;
  onSetMissingTime?: (lineId: string, fallbackTime: number) => void;
  headerAction?: ReactNode;
  currentLineIndex?: number;
  totalLines?: number;
  onJumpToCurrent?: () => void;
}

interface TimeStepperProps {
  value: number;
  onChange: (newValue: number) => void;
  onClose: () => void;
}

function TimeStepper({ value, onChange, onClose }: TimeStepperProps) {
  const [editingValue, setEditingValue] = useState(value);

  const formatTimeForInput = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toFixed(1)}`;
    }
    return secs.toFixed(1);
  };

  const parseTimeInput = (str: string): number => {
    const parts = str.split(':');
    if (parts.length === 2) {
      const mins = parseFloat(parts[0]) || 0;
      const secs = parseFloat(parts[1]) || 0;
      return mins * 60 + secs;
    }
    return parseFloat(str) || 0;
  };

  const handleAdjust = (delta: number) => {
    const newValue = Math.max(0, editingValue + delta);
    setEditingValue(newValue);
  };

  const handleSave = () => {
    onChange(editingValue);
    onClose();
  };

  return (
    <div className="absolute z-10 bg-white border border-gray-300 rounded-lg shadow-lg p-3 min-w-[200px]">
      <div className="flex items-center gap-2 mb-2">
        <input
          type="text"
          value={formatTimeForInput(editingValue)}
          onChange={(e) => {
            const parsed = parseTimeInput(e.target.value);
            if (!isNaN(parsed)) {
              setEditingValue(parsed);
            }
          }}
          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
          placeholder="1:30 또는 90"
        />
        <button
          onClick={onClose}
          className="px-2 py-1 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => handleAdjust(-60)}
          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
        >
          -1분
        </button>
        <button
          onClick={() => handleAdjust(-1)}
          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
        >
          -1초
        </button>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => handleAdjust(0.1)}
            className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-xs"
          >
            ↑
          </button>
          <button
            onClick={() => handleAdjust(-0.1)}
            className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-xs"
          >
            ↓
          </button>
        </div>
        <button
          onClick={() => handleAdjust(1)}
          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
        >
          +1초
        </button>
        <button
          onClick={() => handleAdjust(60)}
          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
        >
          +1분
        </button>
      </div>
      <button
        onClick={handleSave}
        className="w-full px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
      >
        저장
      </button>
    </div>
  );
}

export function TimelineView({
  lines,
  currentTime,
  onSeekTo,
  onTimeUpdate,
  onSetMissingTime,
  headerAction,
  currentLineIndex,
  totalLines,
  onJumpToCurrent,
}: TimelineViewProps) {
  const [editingTime, setEditingTime] = useState<{ lineId: string; type: 'start' | 'end' } | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const [inlineStart, setInlineStart] = useState<Record<string, string>>({});
  const [inlineEnd, setInlineEnd] = useState<Record<string, string>>({});

  const scrollToActiveLine = () => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // 활성 라인으로 자동 스크롤
  useEffect(() => {
    if (activeLineRef.current && timelineRef.current) {
      const timeline = timelineRef.current;
      const activeLine = activeLineRef.current;
      const timelineRect = timeline.getBoundingClientRect();
      const lineRect = activeLine.getBoundingClientRect();

      // 활성 라인이 보이지 않으면 스크롤
      if (lineRect.top < timelineRect.top || lineRect.bottom > timelineRect.bottom) {
        activeLine.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [currentTime, lines]);

  const formatTime = (seconds?: number): string => {
    if (seconds === undefined) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  };

  const parseTimeInput = (value: string): number | null => {
    const normalized = value.replace(',', '.').trim();
    if (!normalized) return null;
    const parts = normalized.split(':');
    if (parts.length === 1) {
      const sec = parseFloat(parts[0]);
      return isNaN(sec) ? null : sec;
    }
    if (parts.length === 2) {
      const mins = parseFloat(parts[0]);
      const secs = parseFloat(parts[1]);
      if (isNaN(mins) || isNaN(secs)) return null;
      return mins * 60 + secs;
    }
    return null;
  };

  const isActive = (line: Line): boolean => {
    if (currentTime === undefined || line.startTime === undefined || line.endTime === undefined) {
      return false;
    }
    return currentTime >= line.startTime && currentTime <= line.endTime;
  };

  const handleLineClick = (line: Line) => {
    // 기록 없는 라인이라면 현재 재생 시점으로 기록 요청
    if (
      line.startTime === undefined &&
      line.endTime === undefined &&
      onSetMissingTime &&
      currentTime !== undefined
    ) {
      onSetMissingTime(line.id, currentTime);
      return;
    }

    if (line.startTime !== undefined && onSeekTo) {
      onSeekTo(line.startTime);
    }
  };

  const handleTimeClick = (e: React.MouseEvent<HTMLSpanElement>, line: Line, type: 'start' | 'end') => {
    e.stopPropagation();
    const targetTime = type === 'start' ? line.startTime : line.endTime;
    if (targetTime !== undefined && onSeekTo) {
      onSeekTo(targetTime);
    }
    setEditingTime({
      lineId: line.id,
      type
    });
  };

  const handleTimeUpdate = (newTime: number) => {
    if (editingTime && onTimeUpdate) {
      onTimeUpdate(editingTime.lineId, editingTime.type, newTime);
    }
    setEditingTime(null);
  };

  return (
    <div className="app-card space-y-3">
      <div className="section-header sticky top-0 z-10 mb-1 bg-white pb-2">
        <div>
          <p className="section-title">타임라인</p>
          <p className="text-xs text-gray-500">행 클릭으로 이동 · 숫자 직접 입력으로 미세 조정</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {typeof currentLineIndex === 'number' && typeof totalLines === 'number' && (
            <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700 border border-blue-100">
              현재 라인 {Math.min(currentLineIndex + 1, totalLines)} / {totalLines}
            </span>
          )}
          <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">총 {lines.length}라인</span>
          {(onJumpToCurrent || activeLineRef.current) && (
            <button
              type="button"
              onClick={() => (onJumpToCurrent ? onJumpToCurrent() : scrollToActiveLine())}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              현재 라인으로 이동
            </button>
          )}
          {headerAction}
        </div>
      </div>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div
          ref={timelineRef}
          className="max-h-[calc(100vh-var(--header-height)-var(--bottom-bar-height)-140px)] overflow-y-auto"
        >
          <div className="grid grid-cols-[70px_minmax(0,1fr)_140px_140px] items-center gap-3 px-3 py-2 bg-gray-50 text-[11px] font-semibold text-gray-600 sticky top-0 z-10 border-b border-gray-200">
            <span>#</span>
            <span>자막 내용</span>
            <span className="text-center">시작</span>
            <span className="text-center">종료</span>
          </div>
          {lines.map((line) => {
            const active = isActive(line);
            const isEditingStart = editingTime?.lineId === line.id && editingTime.type === 'start';
            const isEditingEnd = editingTime?.lineId === line.id && editingTime.type === 'end';

            return (
              <div
                key={line.id}
                ref={active ? activeLineRef : null}
                onClick={() => handleLineClick(line)}
                className={`grid grid-cols-[70px_minmax(0,1fr)_140px_140px] items-start gap-3 px-3 py-3 cursor-pointer transition-colors ${
                  active
                    ? 'bg-blue-50/70 border-l-4 border-blue-400'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className={`px-2 py-1 rounded-full border ${active ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>#{line.order}</span>
                  {active && <span className="w-2 h-2 rounded-full bg-blue-500" aria-hidden />}
                </div>
                <div className="space-y-1">
                  <p className={`text-sm font-medium leading-snug ${active ? 'text-blue-900' : 'text-gray-800'}`}>{line.text}</p>
                  <p className="text-[11px] text-gray-500">라인을 클릭하면 시작 시간으로 이동합니다.</p>
                </div>
                <div className="relative flex flex-col gap-2 text-xs">
                  {isEditingStart && (
                    <div className="absolute z-10 -top-2 left-0">
                      <TimeStepper
                        value={line.startTime || 0}
                        onChange={handleTimeUpdate}
                        onClose={() => setEditingTime(null)}
                      />
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      line.startTime !== undefined && handleTimeClick(e, line, 'start');
                    }}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border font-semibold font-mono ${
                      active
                        ? 'bg-green-100 text-green-900 border-green-200'
                        : 'bg-white text-green-700 border-green-200 hover:bg-green-50'
                    }`}
                  >
                    <span className="text-[11px]">▶ 시작</span>
                    <span>{formatTime(line.startTime)}</span>
                  </button>
                  <input
                    type="text"
                    value={inlineStart[line.id] ?? (line.startTime !== undefined ? formatTime(line.startTime) : '')}
                    onChange={(e) => setInlineStart({ ...inlineStart, [line.id]: e.target.value })}
                    onBlur={() => {
                      const parsed = parseTimeInput(inlineStart[line.id] ?? '');
                      if (parsed !== null && onTimeUpdate) onTimeUpdate(line.id, 'start', parsed);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const parsed = parseTimeInput(inlineStart[line.id] ?? '');
                        if (parsed !== null && onTimeUpdate) onTimeUpdate(line.id, 'start', parsed);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="MM:SS.mmm"
                    className="px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="relative flex flex-col gap-2 text-xs">
                  {isEditingEnd && (
                    <div className="absolute z-10 -top-2 left-0">
                      <TimeStepper
                        value={line.endTime || 0}
                        onChange={handleTimeUpdate}
                        onClose={() => setEditingTime(null)}
                      />
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      line.endTime !== undefined && handleTimeClick(e, line, 'end');
                    }}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border font-semibold font-mono ${
                      active
                        ? 'bg-rose-100 text-rose-900 border-rose-200'
                        : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                    }`}
                  >
                    <span className="text-[11px]">⏹ 종료</span>
                    <span>{formatTime(line.endTime)}</span>
                  </button>
                  <input
                    type="text"
                    value={inlineEnd[line.id] ?? (line.endTime !== undefined ? formatTime(line.endTime) : '')}
                    onChange={(e) => setInlineEnd({ ...inlineEnd, [line.id]: e.target.value })}
                    onBlur={() => {
                      const parsed = parseTimeInput(inlineEnd[line.id] ?? '');
                      if (parsed !== null && onTimeUpdate) onTimeUpdate(line.id, 'end', parsed);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const parsed = parseTimeInput(inlineEnd[line.id] ?? '');
                        if (parsed !== null && onTimeUpdate) onTimeUpdate(line.id, 'end', parsed);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="MM:SS.mmm"
                    className="px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
