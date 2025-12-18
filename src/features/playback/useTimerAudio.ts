import { useState, useEffect, useRef } from 'react';
import { PlaybackController } from './types';

export function useTimerAudio(initialDuration: number): PlaybackController {
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(initialDuration);

    // SSOT: Virtual clock state
    // We use startTime + offset to calculate current time
    const stateRef = useRef({
        startTime: 0, // System time when playback started (or resumed)
        offset: 0,    // Time position when playback started (or resumed)
        isPlaying: false,
        duration: initialDuration,
    });

    // RAF loop for UI updates
    const rafRef = useRef<number>();

    const updateState = () => {
        const s = stateRef.current;
        if (s.isPlaying) {
            const now = performance.now();
            const elapsed = (now - s.startTime) / 1000;
            const nextTime = Math.min(s.offset + elapsed, s.duration);

            setCurrentTime(nextTime);

            if (nextTime >= s.duration) {
                pause();
                seek(s.duration);
            } else {
                rafRef.current = requestAnimationFrame(updateState);
            }
        }
    };

    const play = async () => {
        if (stateRef.current.isPlaying) return;
        if (stateRef.current.offset >= stateRef.current.duration) {
            // If finished, reset slightly or keep logic? 
            // Usually users want to restart if at end, but we'll let seek handle that.
            // For now, if at end, seek to 0 then play
            seek(0);
        }

        stateRef.current.isPlaying = true;
        stateRef.current.startTime = performance.now();
        setIsPlaying(true);

        cancelAnimationFrame(rafRef.current!);
        rafRef.current = requestAnimationFrame(updateState);
    };

    const pause = () => {
        if (!stateRef.current.isPlaying) return;

        // Capture current precise time into offset
        const now = performance.now();
        const elapsed = (now - stateRef.current.startTime) / 1000;
        const nextTime = Math.min(stateRef.current.offset + elapsed, stateRef.current.duration);

        stateRef.current.isPlaying = false;
        stateRef.current.offset = nextTime;

        setIsPlaying(false);
        setCurrentTime(nextTime); // Ensure UI reflects exact stop time
        cancelAnimationFrame(rafRef.current!);
    };

    const seek = (time: number) => {
        const clamped = Math.max(0, Math.min(time, stateRef.current.duration));

        // Update offset (SSOT)
        stateRef.current.offset = clamped;
        // If playing, we must reset startTime to 'now' so the delta is calculated from this new offset
        if (stateRef.current.isPlaying) {
            stateRef.current.startTime = performance.now();
        }

        // Update UI immediately
        setCurrentTime(clamped);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => cancelAnimationFrame(rafRef.current!);
    }, []);

    // Update duration if prop changes
    useEffect(() => {
        stateRef.current.duration = initialDuration;
        setDuration(initialDuration);
    }, [initialDuration]);

    return {
        currentTime,
        duration,
        isPlaying,
        isReady: true,
        play,
        pause,
        seek,
    };
}
