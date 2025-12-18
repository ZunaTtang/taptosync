import type { Line } from '@/models/line';

interface BottomControlBarProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onStartTap: () => void;
  onEndTap: () => void;
  tapMode: 'start' | 'end';
  currentLineIndex: number;
  totalLines: number;
  currentLine?: Line;
  tapDisabled?: boolean;
}

const formatTime = (seconds: number): string => {
  if (!seconds || Number.isNaN(seconds)) return '00:00.000';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
};

export function BottomControlBar({
  currentTime,
  duration,
  isPlaying,
  onTogglePlay,
  onSeek,
  onStartTap,
  onEndTap,
  tapMode,
  currentLineIndex,
  totalLines,
  currentLine,
  tapDisabled,
}: BottomControlBarProps) {
  const progress = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;
  const startPercent =
    currentLine?.startTime !== undefined && duration > 0
      ? Math.min(Math.max((currentLine.startTime / duration) * 100, 0), 100)
      : null;
  const endPercent =
    currentLine?.endTime !== undefined && duration > 0
      ? Math.min(Math.max((currentLine.endTime / duration) * 100, 0), 100)
      : null;

  const handleSeekChange = (value: string) => {
    const parsed = parseFloat(value);
    if (!Number.isNaN(parsed)) {
      onSeek(Math.min(Math.max(parsed, 0), duration));
    }
  };

  const currentLabel = `${Math.min(currentLineIndex + 1, totalLines || 0)} / ${totalLines}`;

  return (
    <div className="bottom-bar fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-[color:var(--color-surface)]/95 backdrop-blur">
      <div className="app-container mx-auto flex flex-col gap-3 px-4 py-3">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-700">
            <span className="rounded-full border border-gray-200 px-3 py-1 font-semibold text-gray-800 bg-white">라인 {currentLabel}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-gray-700">
              <span className={`h-2 w-2 rounded-full ${currentLine?.startTime !== undefined ? 'bg-green-500' : 'bg-gray-300'}`} aria-hidden />
              Start {currentLine?.startTime !== undefined ? 'set' : '대기'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-gray-700">
              <span className={`h-2 w-2 rounded-full ${currentLine?.endTime !== undefined ? 'bg-rose-500' : 'bg-gray-300'}`} aria-hidden />
              End {currentLine?.endTime !== undefined ? 'set' : '대기'}
            </span>
            <div className="ml-auto flex items-center gap-1 text-xs font-semibold text-gray-900">
              <span>{formatTime(currentTime)}</span>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">{formatTime(duration)}</span>
            </div>
          </div>
          <div className="relative h-5 sm:h-6">
            <div className="absolute inset-x-2 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gray-100" aria-hidden />
            <div
              className="absolute left-2 top-1/2 h-1 -translate-y-1/2 rounded-full bg-blue-500"
              style={{ width: `${progress}%` }}
              aria-hidden
            />
            {startPercent !== null && (
              <span
                className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 rounded bg-green-500"
                style={{ left: `${startPercent}%` }}
                aria-hidden
              />
            )}
            {endPercent !== null && (
              <span
                className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 rounded bg-rose-500"
                style={{ left: `${endPercent}%` }}
                aria-hidden
              />
            )}
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.01}
              value={Number.isFinite(currentTime) ? currentTime : 0}
              onChange={(e) => handleSeekChange(e.target.value)}
              className="relative z-10 h-3 w-full cursor-pointer appearance-none bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="재생 위치"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 lg:gap-4">
          <button
            type="button"
            onClick={onTogglePlay}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={isPlaying ? '일시정지' : '재생'}
          >
            <span aria-hidden>{isPlaying ? '⏸' : '▶'}</span>
            <span>{isPlaying ? '일시정지' : '재생'}</span>
          </button>
          <button
            type="button"
            onClick={onStartTap}
            disabled={tapDisabled}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60 ${
              tapMode === 'start'
                ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                : 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-400'
            }`}
            aria-label="시작 탭"
          >
            <span aria-hidden>▶</span>
            <span>시작 탭</span>
          </button>
          <button
            type="button"
            onClick={onEndTap}
            disabled={tapDisabled}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60 ${
              tapMode === 'end'
                ? 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500'
                : 'bg-rose-500 text-white hover:bg-rose-600 focus:ring-rose-400'
            }`}
            aria-label="종료 탭"
          >
            <span aria-hidden>⏹</span>
            <span>종료 탭</span>
          </button>
        </div>
      </div>
    </div>
  );
}
