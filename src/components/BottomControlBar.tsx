import type { Line } from '@/models/line';

interface BottomControlBarProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onStartTap: () => void;
  onEndTap: () => void;
  canTap: boolean;
  currentLineIndex: number;
  totalLines: number;
  currentLine?: Line;
  tapMode: 'start' | 'end';
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
};

export function BottomControlBar({
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onSeek,
  onStartTap,
  onEndTap,
  canTap,
  currentLineIndex,
  totalLines,
  currentLine,
  tapMode,
}: BottomControlBarProps) {
  const safeDuration = duration || 0;
  const ratio = safeDuration > 0 ? Math.min(currentTime / safeDuration, 1) : 0;
  const startRatio = safeDuration > 0 && currentLine?.startTime !== undefined
    ? Math.min(currentLine.startTime / safeDuration, 1)
    : null;
  const endRatio = safeDuration > 0 && currentLine?.endTime !== undefined
    ? Math.min(currentLine.endTime / safeDuration, 1)
    : null;

  return (
    <div className="bottom-bar" role="contentinfo">
      <div className="app-container mx-auto h-full px-4 flex flex-wrap items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onTogglePlay}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label={isPlaying ? '일시정지' : '재생'}
        >
          {isPlaying ? '일시정지' : '재생'}
        </button>

        <div className="flex items-center gap-2 min-w-[190px] text-xs text-gray-700">
          <span className="font-mono text-sm" aria-label="현재 시간">
            {formatTime(currentTime || 0)}
          </span>
          <span className="text-gray-400">/</span>
          <span className="font-mono text-sm" aria-label="총 길이">
            {safeDuration > 0 ? formatTime(safeDuration) : '--:--.--'}
          </span>
        </div>

        <div className="relative flex-1">
          <input
            type="range"
            min={0}
            max={safeDuration || 0}
            value={safeDuration > 0 ? Math.min(currentTime, safeDuration) : 0}
            onChange={(e) => onSeek(Number(e.target.value))}
            disabled={safeDuration <= 0}
            className="w-full h-2 rounded-full bg-gray-200 accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed"
            aria-label="재생 위치"
          />
          <div className="pointer-events-none absolute inset-x-0 -top-1 h-4">
            {startRatio !== null && (
              <span
                className="absolute top-0 w-1.5 h-4 bg-green-500 rounded-full"
                style={{ left: `${startRatio * 100}%` }}
                aria-hidden
              />
            )}
            {endRatio !== null && (
              <span
                className="absolute top-0 w-1.5 h-4 bg-rose-500 rounded-full"
                style={{ left: `${endRatio * 100}%` }}
                aria-hidden
              />
            )}
            <span
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-600"
              style={{ left: `${ratio * 100}%` }}
              aria-hidden
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-700">
          <span className="px-3 py-1 rounded-full border border-gray-200 bg-white" aria-label="현재 라인">
            Line {currentLineIndex + 1} / {totalLines || 1}
          </span>
          <span
            className={`px-3 py-1 rounded-full border text-xs ${tapMode === 'start' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}
          >
            {tapMode === 'start' ? '시작 대기' : '종료 대기'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-xs px-2 py-1 rounded-full border ${currentLine?.startTime !== undefined ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
            시작 {currentLine?.startTime !== undefined ? '기록됨' : '대기'}
          </span>
          <span className={`text-xs px-2 py-1 rounded-full border ${currentLine?.endTime !== undefined ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
            종료 {currentLine?.endTime !== undefined ? '기록됨' : '대기'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onStartTap}
            disabled={!canTap || tapMode !== 'start'}
            className="tap-btn tap-btn-primary"
            aria-label="시작 탭"
          >
            시작 탭
          </button>
          <button
            type="button"
            onClick={onEndTap}
            disabled={!canTap || tapMode !== 'end'}
            className="tap-btn tap-btn-secondary"
            aria-label="종료 탭"
          >
            종료 탭
          </button>
        </div>
      </div>
    </div>
  );
}
