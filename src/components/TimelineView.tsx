import { useState, useRef, useEffect } from 'react';
import type { Line } from '@/models/line';

interface TimelineViewProps {
  lines: Line[];
  currentTime?: number;
  onSeekTo?: (time: number) => void;
  onTimeUpdate?: (lineId: string, time: 'start' | 'end', newTime: number) => void;
  onSetMissingTime?: (lineId: string, fallbackTime: number) => void;
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

export function TimelineView({ lines, currentTime, onSeekTo, onTimeUpdate, onSetMissingTime }: TimelineViewProps) {
  const [editingTime, setEditingTime] = useState<{ lineId: string; type: 'start' | 'end' } | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const [inlineStart, setInlineStart] = useState<Record<string, string>>({});
  const [inlineEnd, setInlineEnd] = useState<Record<string, string>>({});

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
    <div className="card w-full relative">
      <div className="card-header pb-3 border-b border-gray-200 sticky top-0 z-10 bg-white">
        <div>
          <p className="card-title">타임라인</p>
          <p className="card-subtitle">라인별 시작/종료 시점을 한눈에 정렬했습니다</p>
        </div>
        <span className="section-pill">{lines.length} 줄</span>
      </div>

      <div className="relative">
        <div className="grid grid-cols-[72px_1fr_140px_140px] text-xs font-semibold text-gray-600 px-4 py-2 sticky top-[57px] z-10 bg-gray-50 border-b border-gray-200">
          <span className="uppercase tracking-wide">라인</span>
          <span className="uppercase tracking-wide">텍스트</span>
          <span className="uppercase tracking-wide text-right pr-4">시작</span>
          <span className="uppercase tracking-wide text-right pr-4">종료</span>
        </div>
        <div ref={timelineRef} className="max-h-[520px] overflow-y-auto divide-y divide-gray-100">
          {lines.map((line) => {
            const active = isActive(line);
            const isEditingStart = editingTime?.lineId === line.id && editingTime.type === 'start';
            const isEditingEnd = editingTime?.lineId === line.id && editingTime.type === 'end';

            return (
              <div
                key={line.id}
                ref={active ? activeLineRef : null}
                onClick={() => handleLineClick(line)}
                className={`grid grid-cols-[72px_1fr_140px_140px] items-center gap-3 px-4 py-3 cursor-pointer transition-all ${
                  active
                    ? 'bg-blue-50/70 border-l-4 border-blue-500 shadow-[inset_0_1px_0_rgba(59,130,246,0.2)]'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">#{line.order}</span>
                  {line.startTime !== undefined && line.endTime !== undefined ? (
                    <span className="px-2 py-1 text-[11px] rounded-full bg-emerald-50 text-emerald-700">완료</span>
                  ) : (
                    <span className="px-2 py-1 text-[11px] rounded-full bg-amber-50 text-amber-700">대기</span>
                  )}
                </div>

                <div className="text-sm text-gray-800 leading-snug">{line.text}</div>

                <div className="relative flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                  {isEditingStart ? (
                    <div className="relative">
                      <TimeStepper
                        value={line.startTime || 0}
                        onChange={handleTimeUpdate}
                        onClose={() => setEditingTime(null)}
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => line.startTime !== undefined && handleTimeClick(e, line, 'start')}
                      className={`inline-flex items-center justify-between gap-2 rounded-lg px-2 py-1 text-xs font-semibold border focus-ring font-mono ${
                        active
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : 'bg-white text-gray-800 border-gray-200 hover:border-green-300'
                      }`}
                      title="시작 시간"
                    >
                      <span className="text-green-600">▶</span>
                      <span>{formatTime(line.startTime)}</span>
                    </button>
                  )}
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
                    placeholder="MM:SS.mmm"
                    aria-label={`${line.text} 시작 시간`}
                    className="w-full px-2 py-2 text-xs border border-gray-200 rounded-lg bg-white font-mono focus-ring"
                  />
                </div>

                <div className="relative flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                  {isEditingEnd ? (
                    <div className="relative">
                      <TimeStepper
                        value={line.endTime || 0}
                        onChange={handleTimeUpdate}
                        onClose={() => setEditingTime(null)}
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => line.endTime !== undefined && handleTimeClick(e, line, 'end')}
                      className={`inline-flex items-center justify-between gap-2 rounded-lg px-2 py-1 text-xs font-semibold border focus-ring font-mono ${
                        active
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : 'bg-white text-gray-800 border-gray-200 hover:border-rose-300'
                      }`}
                      title="종료 시간"
                    >
                      <span className="text-rose-600">⏹</span>
                      <span>{formatTime(line.endTime)}</span>
                    </button>
                  )}
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
                    placeholder="MM:SS.mmm"
                    aria-label={`${line.text} 종료 시간`}
                    className="w-full px-2 py-2 text-xs border border-gray-200 rounded-lg bg-white font-mono focus-ring"
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
