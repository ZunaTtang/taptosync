import { useState, useEffect, useRef, useCallback } from 'react';
import { AudioPlayer, type AudioPlayerRef } from './components/AudioPlayer';
import { ShortcutSettingsModal, type ShortcutConfig } from './components/ShortcutSettingsModal';
import { getNextLineId } from './features/sync/collector';
import { applyMinGap, smoothIntervals } from './features/sync/smoother';
import { allocateEndTimes } from './features/sync/allocator';
import type { Line } from './models/line';
import { textToLines } from '@/utils/text-processor';
import { calculateAutoEndTime } from '@/utils/reading-speed';
import { useToast, ToastContainer } from './components/Toast';

// Components (The Workbench)
import { SetupTray } from './components/SetupTray';
import { ActiveDeck } from './components/ActiveDeck';
import { TimelineRail } from './components/TimelineRail';
import { TimingPanel } from './components/TimingPanel';
import { VisualTimeline } from './components/VisualTimeline';

function App() {
  // --- SSOT State ---
  // Audio
  const [audioMode, setAudioMode] = useState<'file' | 'timer'>('file');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [timerDuration, setTimerDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [seekStepSeconds] = useState(0.5);

  // Data
  const [lines, setLines] = useState<Line[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);

  // UI State
  const [viewMode, setViewMode] = useState<'deck' | 'list'>('deck');

  // Timing Mode: 'smart' (1-tap) vs 'manual' (2-tap)
  const [timingMode, setTimingMode] = useState<'smart' | 'manual'>('smart');
  const [manualTapState, setManualTapState] = useState<'start' | 'end'>('start');

  // Config
  const [shortcutConfig, setShortcutConfig] = useState<ShortcutConfig>({
    start: 'i',
    end: 'o',
    next: 'ArrowDown',
    endLock: 'e',
  });
  const [isShortcutModalOpen, setIsShortcutModalOpen] = useState(false);

  // Toast & Undo
  const { toasts, showToast, dismissToast } = useToast();

  interface LockOperation {
    lineId: string;
    previousEndTime: number | undefined;
    previousLocked: boolean;
  }
  const [, setLockHistory] = useState<LockOperation[]>([]);

  // Refs
  const audioPlayerRef = useRef<AudioPlayerRef>(null);

  // --- Handlers: Setup ---
  const handleAudioSetup = (file: File | null, duration: number) => {
    if (file) {
      setAudioMode('file');
      setAudioFile(file);
      setTimerDuration(0);
    } else if (duration > 0) {
      setAudioMode('timer');
      setAudioFile(null);
      setTimerDuration(duration);
    }
  };

  const handleTextSetup = (text: string) => {
    const newLines = textToLines(text);
    setLines(newLines);
    setCurrentLineIndex(0);
  };

  // --- Handlers: Playback & Tapping ---
  const handleTogglePlay = useCallback(() => {
    audioPlayerRef.current?.togglePlay();
  }, []);

  const handleSeek = (time: number) => {
    audioPlayerRef.current?.seek(time);
  };

  /**
   * Smart Tap: 1-tap auto-complete with Progressive End Time
   * - Tapping Line N closes Line N-1 (if gap is reasonable)
   * - Auto-calculates end time based on text length
   * - Handles silence gaps intelligently
   */
  const handleSmartTap = () => {
    if (currentLineIndex >= lines.length || audioDuration <= 0) return;

    const actualTime = audioPlayerRef.current?.getCurrentTime() ?? currentTime;
    const targetLine = lines[currentLineIndex];

    // Configuration (could be made user-adjustable)
    const HOLD_MAX = 0.6;           // Hold subtitle for short silences (reduce flicker)
    const BASE_THRESHOLD = 2.5;     // Base gap threshold for short-form
    const THRESHOLD_MULTIPLIER = 2.0; // Adaptive scaling

    // Calculate auto end time for current line
    const autoEndTime = calculateAutoEndTime(actualTime, targetLine.text);

    // Update lines array
    const updatedLines = lines.map((line, idx) => {
      // Handle previous line closure
      if (idx === currentLineIndex - 1 && currentLineIndex > 0) {
        // Skip extended logic if already locked
        if (line.isEndLocked) return line;

        const prevEnd = line.endTime ?? line.startTime ?? 0;
        const gap = actualTime - prevEnd;

        // Adaptive threshold based on previous line duration
        const prevDuration = prevEnd - (line.startTime ?? 0);
        const threshold = Math.max(BASE_THRESHOLD, prevDuration * THRESHOLD_MULTIPLIER);

        if (gap < HOLD_MAX) {
          // Hold mode: keep auto-calculated end (reduce flicker for very short silences)
          return line;
        } else if (gap < threshold) {
          // Progressive closure: close at current tap time
          return { ...line, endTime: actualTime };
        }
        // else: gap too large (likely scene change), keep auto-calculated end
        return line;
      }

      // Set current line with temporary end time
      if (idx === currentLineIndex) {
        return { ...line, startTime: actualTime, endTime: autoEndTime };
      }

      return line;
    });

    // Process with smoothing and allocation
    const processed = allocateEndTimes(smoothIntervals(applyMinGap(updatedLines)), audioDuration);
    setLines(processed);

    // Auto-advance to next line
    const nextId = getNextLineId(processed, targetLine.order);
    if (nextId) {
      setCurrentLineIndex(processed.findIndex(l => l.id === nextId));
    } else {
      setCurrentLineIndex(currentLineIndex + 1);
    }
  };

  /**
   * Manual Tap: 2-Tap Logic
   * Tap 1: Set Start -> State becomes 'end'
   * Tap 2: Set End -> State becomes 'start', Advance
   */
  const handleManualTap = () => {
    if (currentLineIndex >= lines.length) return;

    const actualTime = audioPlayerRef.current?.getCurrentTime() ?? currentTime;
    const currentLine = lines[currentLineIndex];

    if (manualTapState === 'start') {
      // Tap 1: Set Start Time
      handleUpdateLine(currentLine.id, { startTime: actualTime, endTime: undefined });
      setManualTapState('end');
    } else {
      // Tap 2: Set End Time
      handleUpdateLine(currentLine.id, { endTime: actualTime });
      setManualTapState('start');
      // Auto-advance
      const nextId = getNextLineId(lines, currentLine.order);
      if (nextId) setCurrentLineIndex(lines.findIndex(l => l.id === nextId));
      else setCurrentLineIndex(currentLineIndex + 1);
    }
  };

  const handleUpdateLine = (lineId: string, updates: Partial<Line>) => {
    setLines(prev => {
      const updated = prev.map(l => l.id === lineId ? { ...l, ...updates } : l);
      return allocateEndTimes(smoothIntervals(applyMinGap(updated)), audioDuration);
    });
  };

  const handleTimeUpdate = (lineId: string, type: 'start' | 'end', newTime: number) => {
    handleUpdateLine(lineId, type === 'start' ? { startTime: newTime } : { endTime: newTime });
  };

  // --- Effects: Shortcuts & Events ---
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || isShortcutModalOpen) return;

      const lowerKey = e.key.toLowerCase();

      if (lowerKey === ' ' || lowerKey === 'spacebar') {
        e.preventDefault();
        handleTogglePlay();
        return;
      }
      // Smart Tap vs Manual Tap
      if (lowerKey === shortcutConfig.start.toLowerCase() || lowerKey === shortcutConfig.end.toLowerCase()) {
        e.preventDefault();
        if (timingMode === 'smart') {
          handleSmartTap();
        } else {
          handleManualTap();
        }
      } else if (lowerKey === (shortcutConfig.endLock || 'e').toLowerCase()) {
        // End Lock Logic
        e.preventDefault();
        if (currentLineIndex < lines.length) {
          const actualTime = audioPlayerRef.current?.getCurrentTime() ?? currentTime;
          const currentId = lines[currentLineIndex].id;

          // Push to undo stack
          setLockHistory(prev => [...prev, {
            lineId: currentId,
            previousEndTime: lines[currentLineIndex].endTime,
            previousLocked: !!lines[currentLineIndex].isEndLocked
          }]);

          // Lock current line
          handleUpdateLine(currentId, {
            endTime: actualTime,
            isEndLocked: true
          });

          // Show feedback
          showToast("End Locked - Undo: Ctrl+Z", 3000, 'success');

          // Advance
          const nextId = getNextLineId(lines, lines[currentLineIndex].order);
          if (nextId) setCurrentLineIndex(lines.findIndex(l => l.id === nextId));
          else setCurrentLineIndex(currentLineIndex + 1);
        }
      } else if (lowerKey === 'arrowleft') {
        // quick seek back
        handleSeek(Math.max(0, currentTime - 2));
      } else if (e.ctrlKey && lowerKey === 'z') {
        e.preventDefault();
        // Undo Logic
        setLockHistory(prev => {
          if (prev.length === 0) return prev;

          const lastOp = prev[prev.length - 1];
          const rest = prev.slice(0, -1);

          handleUpdateLine(lastOp.lineId, {
            endTime: lastOp.previousEndTime,
            isEndLocked: lastOp.previousLocked
          });

          // Navigate back to the line
          const lineIdx = lines.findIndex(l => l.id === lastOp.lineId);
          if (lineIdx !== -1) setCurrentLineIndex(lineIdx);

          showToast("Undo: End Lock Restored", 1000, 'info');

          return rest;
        });
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [handleTogglePlay, shortcutConfig, handleSmartTap, isShortcutModalOpen, currentTime]);


  // --- Derived State for UI ---
  const currentLine = lines[currentLineIndex];
  const prevLine = lines[currentLineIndex - 1];
  const nextLine = lines[currentLineIndex + 1];

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100 overflow-hidden font-sans text-gray-900">

      {/* 0. Hidden Logic */}
      <AudioPlayer
        ref={audioPlayerRef}
        mode={audioMode}
        file={audioFile}
        timerDuration={timerDuration}
        onTimeUpdate={setCurrentTime}
        onDurationChange={setAudioDuration}
        onPlayingChange={setIsPlaying}
        seekStepSeconds={seekStepSeconds}
      />
      {isShortcutModalOpen && <ShortcutSettingsModal initialConfig={shortcutConfig} onSave={setShortcutConfig} onClose={() => setIsShortcutModalOpen(false)} />}

      {/* 1. Top: Setup Tray */}
      {/* 1. Top: Setup Tray */}
      <SetupTray
        onAudioSetup={handleAudioSetup}
        onTextSetup={handleTextSetup}
        audioName={audioFile?.name ?? (timerDuration > 0 ? "Timer Mode" : null)}
        hasText={lines.length > 0}
        viewMode={viewMode}
        onToggleView={setViewMode}
        timingMode={timingMode}
        onToggleTimingMode={setTimingMode}
      />

      {/* 2. Middle: Visual Timeline / Active Deck / Timing Panel */}
      {/* 2. Middle: Visual Timeline (Fixed Top) + Split View (Deck/List) */}
      <div className="flex-1 flex flex-col overflow-hidden relative">

        {/* Waveform (Always Visible) */}


        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left: Active Deck (Main) */}
          <div className={`flex-1 transition-all duration-300 ${viewMode === 'list' ? 'hidden md:flex md:w-1/2' : 'flex w-full'}`}>
            <ActiveDeck
              currentLine={currentLine}
              prevLine={prevLine}
              nextLine={nextLine}
              isPlaying={isPlaying}
              timingMode={timingMode}
              manualTapState={manualTapState}
            />
          </div>

          {/* Right: Timing List (Toggleable/Responsive) */}
          <div className={`transition-all duration-300 border-l border-gray-200 bg-white ${viewMode === 'list' ? 'flex-1 w-full md:w-1/2' : 'w-0 overflow-hidden'}`}>
            <div className="h-full w-full relative">
              <TimingPanel
                lines={lines}
                currentLineIndex={currentLineIndex}
                currentTime={currentTime}
                onSeek={handleSeek}
                onUpdateLine={handleUpdateLine}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom: Timeline Rail (Hero) */}
      <TimelineRail
        lines={lines}
        currentTime={currentTime}
        duration={audioDuration}
        isPlaying={isPlaying}
        onSeek={handleSeek}
        onTogglePlay={handleTogglePlay}
        onTimeUpdate={handleTimeUpdate}
        audioFile={audioFile}
      />

      {/* Quick link to shortcuts */}
      <div className="fixed top-2 right-4 z-50">
        <button onClick={() => setIsShortcutModalOpen(true)} className="text-xs text-gray-400 hover:text-gray-600">⌨️</button>
      </div>

      {/* Toast Notifications */}
      <ToastContainer messages={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
