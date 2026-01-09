import { useRef, useEffect, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.js';
import type { Line } from '@/models/line';

interface VisualTimelineProps {
    audioFile: File | null;
    lines: Line[];
    currentTime: number;
    // duration: number; // Removed unused prop
    isPlaying: boolean;
    onSeek: (time: number) => void;
    onUpdateLine: (lineId: string, updates: Partial<Line>) => void;
}

export function VisualTimeline({
    audioFile,
    lines,
    currentTime,
    // duration, // unused by WS 
    isPlaying,
    onSeek,
    onUpdateLine
}: VisualTimelineProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const regionsRef = useRef<RegionsPlugin | null>(null);
    const [isReady, setIsReady] = useState(false);

    // 1. Initialize WaveSurfer
    useEffect(() => {
        if (!containerRef.current || !audioFile) return;

        // cleanup old instance
        if (wavesurferRef.current) {
            wavesurferRef.current.destroy();
            wavesurferRef.current = null;
        }

        const ws = WaveSurfer.create({
            container: containerRef.current,
            waveColor: '#A855F7', // Purple-500
            progressColor: '#7E22CE', // Purple-700
            cursorColor: '#EF4444', // Red-500
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            height: 128,
            normalize: true,
            minPxPerSec: 100, // Zoom level
            autoScroll: true,
            interact: true, // Allow seeking on click
            plugins: [
                TimelinePlugin.create({
                    container: '#timeline', // We'll need a container for this
                    formatTimeCallback: (seconds) => {
                        const min = Math.floor(seconds / 60);
                        const sec = Math.floor(seconds % 60);
                        return `${min}:${sec.toString().padStart(2, '0')}`;
                    },
                    timeInterval: 5,
                }),
            ],
        });

        // Initialize Regions Plugin
        const wsRegions = RegionsPlugin.create();
        ws.registerPlugin(wsRegions);
        regionsRef.current = wsRegions;

        // Load Audio
        const url = URL.createObjectURL(audioFile);
        ws.load(url);

        ws.on('ready', () => {
            setIsReady(true);
            URL.revokeObjectURL(url); // Clean up blob
        });

        // Sync Events
        ws.on('interaction', (newTime) => {
            onSeek(newTime);
        });

        /* 
           Note: We do NOT bind ws.on('timeupdate') to update App state to avoid loop.
           App state drives the WS cursor via useEffect below.
           WS is purely visualization + click-to-seek input.
        */

        wavesurferRef.current = ws;

        return () => {
            if (ws) ws.destroy();
        };
    }, [audioFile, onSeek]); // Re-init on file change

    // 2. Sync Playback State (App -> WS)
    useEffect(() => {
        const ws = wavesurferRef.current;
        if (!ws || !isReady) return;

        if (isPlaying && !ws.isPlaying()) {
            ws.play();
        } else if (!isPlaying && ws.isPlaying()) {
            ws.pause();
        }
    }, [isPlaying, isReady]);

    // 3. Sync Time (App -> WS) - Critical: Sync only if drastically different to prevent stutter
    useEffect(() => {
        const ws = wavesurferRef.current;
        if (!ws || !isReady) return;

        // Tolerance check to avoid fighting with audio player's native update
        const diff = Math.abs(ws.getCurrentTime() - currentTime);
        if (diff > 0.3) {
            ws.setTime(currentTime);
        }
    }, [currentTime, isReady]);

    // 4. Render Lyric Regions
    useEffect(() => {
        const wsRegions = regionsRef.current;
        if (!wsRegions || !isReady) return;

        // Simple diffing: Clear all and redraw (inefficient but safe for now)
        // Optimization: Track region IDs and update only changed ones
        wsRegions.clearRegions();

        lines.forEach((line) => {
            if (line.startTime !== undefined && line.endTime !== undefined) {
                wsRegions.addRegion({
                    id: line.id,
                    start: line.startTime,
                    end: line.endTime,
                    content: line.text,
                    color: 'rgba(168, 85, 247, 0.2)', // Purple transparent
                    drag: false, // For now, read-only
                    resize: false,
                });
            }
        });

        // Region Interaction (Future: Enable drag/resize)
        // wsRegions.on('region-updated', (region) => {
        //   onUpdateLine(region.id, { startTime: region.start, endTime: region.end });
        // });

    }, [lines, isReady, onUpdateLine]);

    if (!audioFile) {
        return <div className="h-32 flex items-center justify-center text-gray-400 bg-gray-50 border rounded-lg">No audio loaded</div>;
    }

    return (
        <div className="w-full relative">
            <div id="timeline" className="mb-0" />
            <div ref={containerRef} className="w-full" />

            {/* Zoom Controls (Optional) */}
            <div className="absolute top-2 right-2 flex gap-1">
                <button
                    className="bg-white/80 p-1 text-xs rounded border hover:bg-white"
                    onClick={() => wavesurferRef.current?.zoom(wavesurferRef.current.options.minPxPerSec! * 1.2)}
                >+</button>
                <button
                    className="bg-white/80 p-1 text-xs rounded border hover:bg-white"
                    onClick={() => wavesurferRef.current?.zoom(wavesurferRef.current.options.minPxPerSec! * 0.8)}
                >-</button>
            </div>
        </div>
    );
}
