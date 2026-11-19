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
    <div className="w-full relative">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">타임라인</h3>
      <div ref={timelineRef} className="space-y-2 max-h-96 overflow-y-auto">
        {lines.map((line) => {
          const active = isActive(line);
          const isEditingStart = editingTime?.lineId === line.id && editingTime.type === 'start';
          const isEditingEnd = editingTime?.lineId === line.id && editingTime.type === 'end';
          
          return (
            <div
              key={line.id}
              ref={active ? activeLineRef : null}
              onClick={() => handleLineClick(line)}
              className={`p-3 rounded-lg border cursor-pointer transition-all duration-300 ${
                active
                  ? 'bg-blue-100 border-blue-600 shadow-md scale-[1.02]'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className={`text-sm font-medium mb-1 transition-colors ${
                    active
                      ? 'text-blue-900 font-semibold'
                      : 'text-gray-700'
                  }`}>
                    {line.text}
                  </div>
                  <div className={`text-xs flex items-center gap-2 flex-wrap transition-colors ${
                    active ? 'text-blue-700' : 'text-gray-500'
                  }`}>
                    {isEditingStart ? (
                      <div className="relative">
                        <TimeStepper
                          value={line.startTime || 0}
                          onChange={handleTimeUpdate}
                          onClose={() => setEditingTime(null)}
                        />
                      </div>
                    ) : (
                      <span
                        onClick={(e) => line.startTime !== undefined && handleTimeClick(e, line, 'start')}
                        className={`px-2 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-1 ${
                          active
                            ? 'bg-green-200 hover:bg-green-300 text-green-900 font-semibold'
                            : 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-200'
                        }`}
                        title="시작 시간"
                      >
                        <span className="text-xs">▶</span>
                        {formatTime(line.startTime)}
                      </span>
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
                      className="px-2 py-1 text-xs border border-gray-200 rounded bg-white"
                    />
                    <span className="text-gray-400">→</span>
                    {isEditingEnd ? (
                      <div className="relative">
                        <TimeStepper
                          value={line.endTime || 0}
                          onChange={handleTimeUpdate}
                          onClose={() => setEditingTime(null)}
                        />
                      </div>
                    ) : (
                      <span
                        onClick={(e) => line.endTime !== undefined && handleTimeClick(e, line, 'end')}
                        className={`px-2 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-1 ${
                          active
                            ? 'bg-red-200 hover:bg-red-300 text-red-900 font-semibold'
                            : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                        }`}
                        title="종료 시간"
                      >
                        <span className="text-xs">⏹</span>
                        {formatTime(line.endTime)}
                      </span>
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
                      className="px-2 py-1 text-xs border border-gray-200 rounded bg-white"
                    />
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  #{line.order}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
