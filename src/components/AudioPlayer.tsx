import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useFileAudio } from '@/features/playback/useFileAudio';
import { useTimerAudio } from '@/features/playback/useTimerAudio';
import type { PlaybackController } from '@/features/playback/types';

interface AudioPlayerProps {
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onPlayingChange?: (isPlaying: boolean) => void;
  seekStepSeconds?: number;
}

export interface AudioPlayerRef {
  seek: (time: number) => void;
  togglePlay: () => void;
  getCurrentTime: () => number; // Legacy support if needed
}

type PlayerMode = 'file' | 'timer';

export const AudioPlayer = forwardRef<AudioPlayerRef, AudioPlayerProps>(
  ({ onTimeUpdate, onDurationChange, onPlayingChange, seekStepSeconds = 0.5 }, ref) => {
    const [mode, setMode] = useState<PlayerMode>('file');

    // File Mode State
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Timer Mode State
    const [timerInput, setTimerInput] = useState('');
    const [timerDuration, setTimerDuration] = useState(0);

    // Hooks
    const fileAudio = useFileAudio(audioFile);
    const timerAudio = useTimerAudio(timerDuration);

    const activeController: PlaybackController = mode === 'file' ? fileAudio : timerAudio;

    // derived for UI
    const isPlaying = activeController.isPlaying;
    const currentTime = activeController.currentTime;
    const duration = activeController.duration;

    // Sync to parent
    useEffect(() => {
      onTimeUpdate?.(currentTime);
    }, [currentTime, onTimeUpdate]);

    useEffect(() => {
      onDurationChange?.(duration);
    }, [duration, onDurationChange]);

    useEffect(() => {
      onPlayingChange?.(isPlaying);
    }, [isPlaying, onPlayingChange]);

    // Handle Keyboard Seek (Arrow Keys) - Locally controlled for now or passed from App? 
    // AGENTS.md says "App.tsx must NOT manage playback timing state". 
    // So Arrow keys logic should ideally be here or in a hook, but App.tsx has global listeners too.
    // The previous implementation had a listener here. We'll keep it here for focused control.
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          activeController.seek(activeController.currentTime - seekStepSeconds);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          activeController.seek(activeController.currentTime + seekStepSeconds);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeController, seekStepSeconds]);

    // Expose API
    useImperativeHandle(ref, () => ({
      seek: (time: number) => activeController.seek(time),
      togglePlay: () => {
        if (activeController.isPlaying) activeController.pause();
        else activeController.play();
      },
      getCurrentTime: () => activeController.currentTime,
    }));

    // UI Logic
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i)) {
          setError('지원하지 않는 파일 형식입니다.');
          return;
        }
        setError(null);
        setAudioFile(file);
      } else {
        setAudioFile(null);
      }
    };

    const handleSetTimer = () => {
      // Parse "mm:ss" or "ss"
      const parts = timerInput.split(':');
      let sec = 0;
      if (parts.length === 2) {
        sec = parseInt(parts[0], 10) * 60 + parseFloat(parts[1]);
      } else {
        sec = parseFloat(parts[0]);
      }

      if (sec > 0) {
        setTimerDuration(sec);
        setError(null);
      } else {
        setError('올바른 시간을 입력하세요 (예: 1:30 또는 90)');
      }
    };

    const handleTogglePlay = () => {
      if (activeController.isPlaying) activeController.pause();
      else activeController.play();
    };

    const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      activeController.seek(Number(e.target.value));
    };

    const formatTime = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      const ms = Math.floor((seconds % 1) * 1000);
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
    };

    return (
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-2">오디오 소스 선택</label>

        {/* Mode Switch */}
        <div className="mb-4 flex items-center gap-3">
          <span className={`text-sm font-medium transition-colors ${mode === 'file' ? 'text-gray-700' : 'text-gray-400'}`}>파일 업로드</span>
          <button
            type="button"
            onClick={() => {
              setMode(prev => prev === 'file' ? 'timer' : 'file');
              setError(null);
              // Resetting logic implies pausing previous controller? 
              // React will switch activeController, effect cleanups will stop playback ideally (if we added pause on unmount).
              // useFileAudio cleans up listeners but audio element might keep playing if not paused?
              // Let's rely on hooks handling their internal state or add effect to pause on mode switch if needed.
              activeController.pause();
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${mode === 'file' ? 'bg-blue-600' : 'bg-gray-300'
              }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${mode === 'file' ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
          <span className={`text-sm font-medium transition-colors ${mode === 'timer' ? 'text-gray-700' : 'text-gray-400'}`}>파일 없이 시작</span>
        </div>

        {/* File Mode UI */}
        {mode === 'file' && (
          <>
            <input
              type="file"
              accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.webm"
              onChange={handleFileChange}
              className="mb-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {/* Audio Element from Hook */}
            <audio ref={fileAudio.audioRef} className="hidden" preload="metadata" />
          </>
        )}

        {/* Timer Mode UI */}
        {mode === 'timer' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">재생 시간 입력</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={timerInput}
                onChange={(e) => setTimerInput(e.target.value)}
                placeholder="1:30 또는 90"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
              />
              <button onClick={handleSetTimer} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">설정</button>
            </div>
          </div>
        )}

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

        {/* Common Player Controls */}
        {duration > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <button
                onClick={handleTogglePlay}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {isPlaying ? '일시정지' : '재생'}
              </button>
              <span className="text-sm text-gray-600">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <span className="text-xs text-gray-500">
                {mode === 'file' ? audioFile?.name : '타이머 모드'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max={duration}
              step="0.01"
              value={currentTime}
              onChange={handleSeekChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        )}
      </div>
    );
  }
);

AudioPlayer.displayName = 'AudioPlayer';

