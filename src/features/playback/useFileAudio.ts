import { useState, useEffect, useRef } from 'react';
import { PlaybackController } from './types';

export function useFileAudio(file: File | null): PlaybackController & { audioRef: React.RefObject<HTMLAudioElement> } {
    const audioRef = useRef<HTMLAudioElement>(null);

    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isReady, setIsReady] = useState(false);

    // Sync internal state with audio events
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
        };

        const handleDurationChange = () => {
            if (isFinite(audio.duration)) {
                setDuration(audio.duration);
                setIsReady(true);
            }
        };

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleEnded = () => setIsPlaying(false);
        const handleError = (e: any) => {
            console.error('Audio error:', e);
            setIsPlaying(false);
            setIsReady(false);
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('durationchange', handleDurationChange);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);
        audio.addEventListener('loadedmetadata', handleDurationChange);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('durationchange', handleDurationChange);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
            audio.removeEventListener('loadedmetadata', handleDurationChange);
        };
    }, []);

    // Load file when changed
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (file) {
            const url = URL.createObjectURL(file);
            audio.src = url;
            audio.load();
            setIsReady(false); // Wait for metadata
            return () => URL.revokeObjectURL(url);
        } else {
            audio.removeAttribute('src');
            audio.load();
            setIsReady(false);
            setDuration(0);
            setCurrentTime(0);
            setIsPlaying(false);
        }
    }, [file]);

    const play = async () => {
        if (audioRef.current && file) {
            try {
                await audioRef.current.play();
            } catch (err) {
                console.error('Play failed:', err);
            }
        }
    };

    const pause = () => {
        audioRef.current?.pause();
    };

    const seek = (time: number) => {
        if (audioRef.current && isFinite(duration)) {
            const clamped = Math.max(0, Math.min(time, duration));
            audioRef.current.currentTime = clamped;
            // Optimistic update
            setCurrentTime(clamped);
        }
    };

    return {
        audioRef,
        currentTime,
        duration,
        isPlaying,
        isReady,
        play,
        pause,
        seek,
    };
}
