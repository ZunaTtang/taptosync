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
    <div className="flex gap-2">
      <button
        onClick={handleStartClick}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`flex-1 px-6 py-4 text-white text-lg font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all ${
          currentMode === 'start'
            ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500 shadow-md scale-105'
            : 'bg-green-400 hover:bg-green-500 focus:ring-green-400'
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
        className={`flex-1 px-6 py-4 text-white text-lg font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all ${
          currentMode === 'end'
            ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500 shadow-md scale-105'
            : 'bg-red-400 hover:bg-red-500 focus:ring-red-400'
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
