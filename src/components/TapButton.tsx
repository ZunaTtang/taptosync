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
    <div className="flex gap-3">
      <button
        onClick={handleStartClick}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-pressed={currentMode === 'start'}
        className={`flex-1 px-6 py-4 text-white text-lg font-semibold rounded-xl focus-ring disabled:bg-gray-400 disabled:cursor-not-allowed transition-all ${
          currentMode === 'start'
            ? 'bg-blue-600 hover:bg-blue-700 shadow-lg scale-[1.01]'
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        <div className="flex items-center justify-center gap-3">
          <span aria-hidden className="text-xl">▶</span>
          <span>시작 탭</span>
        </div>
      </button>
      <button
        onClick={handleEndClick}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-pressed={currentMode === 'end'}
        className={`flex-1 px-6 py-4 text-white text-lg font-semibold rounded-xl focus-ring disabled:bg-gray-400 disabled:cursor-not-allowed transition-all ${
          currentMode === 'end'
            ? 'bg-rose-600 hover:bg-rose-700 shadow-lg scale-[1.01]'
            : 'bg-rose-500 hover:bg-rose-600'
        }`}
      >
        <div className="flex items-center justify-center gap-3">
          <span aria-hidden className="text-xl">⏹</span>
          <span>종료 탭</span>
        </div>
      </button>
    </div>
  );
}
