interface TapButtonProps {
  onStartTap: () => void;
  onEndTap: () => void;
  disabled?: boolean;
  currentMode?: 'start' | 'end';
}

export function TapButton({ onStartTap, onEndTap, disabled = false, currentMode = 'start' }: TapButtonProps) {
  const handleStartClick = () => {
    if (!disabled) {
      onStartTap();
    }
  };

  const handleEndClick = () => {
    if (!disabled) {
      onEndTap();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (currentMode === 'start') {
        onStartTap();
      } else {
        onEndTap();
      }
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <button
        onClick={handleStartClick}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label="시작 탭"
        className={`h-14 px-6 py-4 text-white text-lg font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-all shadow-sm ${
          currentMode === 'start'
            ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500 shadow-md'
            : 'bg-green-500 hover:bg-green-600 focus:ring-green-400'
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl">▶</span>
          <span>시작 탭</span>
        </div>
      </button>
      <button
        onClick={handleEndClick}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label="종료 탭"
        className={`h-14 px-6 py-4 text-white text-lg font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-all shadow-sm ${
          currentMode === 'end'
            ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500 shadow-md'
            : 'bg-rose-500 hover:bg-rose-600 focus:ring-rose-400'
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl">⏹</span>
          <span>종료 탭</span>
        </div>
      </button>
    </div>
  );
}
