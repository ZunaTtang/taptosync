import { useEffect, useImperativeHandle, forwardRef } from 'react';
import { useFileAudio } from '@/features/playback/useFileAudio';
import { useTimerAudio } from '@/features/playback/useTimerAudio';
import type { PlaybackController } from '@/features/playback/types';

export interface AudioPlayerProps {
  mode: 'file' | 'timer';
  file: File | null;
  timerDuration: number;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onPlayingChange?: (isPlaying: boolean) => void;
  seekStepSeconds?: number;
}

export interface AudioPlayerRef {
  seek: (time: number) => void;
  togglePlay: () => void;
  getCurrentTime: () => number;
}

export const AudioPlayer = forwardRef<AudioPlayerRef, AudioPlayerProps>(
  ({ mode, file, timerDuration, onTimeUpdate, onDurationChange, onPlayingChange, seekStepSeconds = 0.5 }, ref) => {

    // Hooks manage specific logic
    const fileAudio = useFileAudio(file);
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

    // Handle Keyboard Seek (Arrow Keys)
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

    return (
      <>
        {/* Render audio element for file mode */}
        {mode === 'file' && (
          <audio ref={fileAudio.audioRef} className="hidden" preload="metadata" />
        )}
        {/* Timer mode is purely virtual, no element needed */}
      </>
    );
  }
);

AudioPlayer.displayName = 'AudioPlayer';

