import { useRef, useState, useEffect } from 'react';
import type { Line } from '@/models/line';
import { ExportPanel } from './ExportPanel';
import WaveSurfer from 'wavesurfer.js';

interface TimelineRailProps {
    lines: Line[];
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    onSeek: (time: number) => void;
    onTogglePlay: () => void;
    onTimeUpdate: (lineId: string, type: 'start' | 'end', time: number) => void;
    audioFile: File | null;
}

export function TimelineRail({
    lines,
    currentTime,
    duration,
    isPlaying,
    onSeek,
    onTogglePlay,
    onTimeUpdate,
    audioFile
}: TimelineRailProps) {
    const [isHovering, setIsHovering] = useState(false);
    const railRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const [isReady, setIsReady] = useState(false);

    // --- Wavesurfer Integration ---
    useEffect(() => {
        if (!railRef.current || !audioFile) return;

        // Cleanup
        if (wavesurferRef.current) {
            wavesurferRef.current.destroy();
            wavesurferRef.current = null;
        }

        const ws = WaveSurfer.create({
            container: railRef.current,
            waveColor: '#A855F7', // Purple-500
            progressColor: '#7E22CE', // Purple-700
            cursorColor: 'transparent', // Custom cursor handled below
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            height: 128, // Match container height approx or fit
            normalize: true,
            minPxPerSec: 50, // Overview mode (smaller zoom)
            autoScroll: false, // Rail is usually an overview
            interact: false, // We handle interactions via rail click
            hideScrollbar: true,
        });

        const url = URL.createObjectURL(audioFile);
        ws.load(url);

        ws.on('ready', () => {
            setIsReady(true);
            URL.revokeObjectURL(url);
        });

        wavesurferRef.current = ws;

        return () => {
            ws.destroy();
        };
    }, [audioFile]);

    // Sync Playback and Time (App -> WS)
    // Note: In "overview/rail" mode, we usually just show the whole waveform static. 
    // If the rail is meant to be scrollable/zoomable, we sync time.
    // If it's a fixed "mini-map", we don't need to sync seek, just progress.
    // Given the previous TimelineRail was "fixed bottom", it acts like a track.

    // For now, let's keep it simple: Waveform renders once. We use the custom Playhead overlay.
    // But if we want it to Scroll, we need sync. 
    // The previous VisualTimeline had zoom. This Rail seems to have fixed duration? 
    // "TimelineRail" implies a full view. Let's stick to full view logic (minPxPerSec low).

    // Helper formats
    const formatTime = (seconds: number) => {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 10);
        return `${min}:${sec.toString().padStart(2, '0')}.${ms}`;
    };

    // Interaction Handlers
    const handleRailClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!railRef.current || duration <= 0) return;
        const rect = railRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = Math.max(0, Math.min(1, x / rect.width));
        onSeek(percent * duration);
    };

    const handleMarkerDrag = (e: React.MouseEvent, lineId: string, type: 'start' | 'end') => {
        e.stopPropagation();
        console.log('Drag started', lineId, type);
        // Placeholder for full drag logic
        if (onTimeUpdate) { /* Logic pending */ }
    };

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-48 flex flex-col z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            {/* Controls Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onTogglePlay}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
                    >
                        {isPlaying ? '⏸' : '▶'}
                    </button>
                    <div className="text-xl font-mono font-bold text-gray-800">
                        {formatTime(currentTime)}
                        <span className="text-sm text-gray-400 font-normal ml-2">/ {formatTime(duration)}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <ExportPanel lines={lines} compact />
                </div>
            </div>

            {/* The Rail Area */}
            <div
                className="flex-1 relative overflow-hidden bg-gray-100 cursor-crosshair select-none"
                ref={railRef}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onClick={handleRailClick}
            >
                {/* Waveform injected here by Wavesurfer */}

                {/* Markers */}
                {lines.map((line) => {
                    if (line.startTime === undefined) return null;
                    const left = (line.startTime / duration) * 100;
                    return (
                        <div
                            key={`${line.id}-start`}
                            className="absolute top-0 bottom-0 w-0.5 bg-green-500 z-10 group"
                            style={{ left: `${left}%` }}
                            onClick={(e) => { e.stopPropagation(); onSeek(line.startTime!); }}
                            onMouseDown={(e) => handleMarkerDrag(e, line.id, 'start')}
                        >
                            <div className="absolute top-0 -left-1 w-2 h-2 bg-green-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    );
                })}

                {/* Playhead */}
                <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                    style={{ left: `${progressPercent}%` }}
                >
                    <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rotate-45 transform" />
                </div>
            </div>
        </div>
    );
}
