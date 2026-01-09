import { useRef, useState, useEffect } from 'react';
import type { Line } from '@/models/line';
import { formatTime, parseTime } from '@/utils/time';

interface TimingPanelProps {
    lines: Line[];
    currentLineIndex: number;
    currentTime: number;
    onSeek: (time: number) => void;
    onUpdateLine: (lineId: string, updates: Partial<Line>) => void;
}

interface TimeInputProps {
    value: number | undefined;
    onChange: (newValue: number) => void;
    onNudge: (amount: number) => void;
    className?: string;
}

function TimeInput({ value, onChange, onNudge, className = '' }: TimeInputProps) {
    const [text, setText] = useState(formatTime(value));
    const [isEditing, setIsEditing] = useState(false);

    // Update text when external value changes (unless editing)
    useEffect(() => {
        if (!isEditing) {
            setText(formatTime(value));
        }
    }, [value, isEditing]);

    const commit = () => {
        const parsed = parseTime(text);
        if (parsed !== null && parsed >= 0) {
            // Only change if different
            if (parsed !== value) {
                onChange(parsed);
            }
        } else {
            // Revert if invalid
            setText(formatTime(value));
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            commit();
            (e.target as HTMLInputElement).blur();
        } else if (e.key === 'Escape') {
            setText(formatTime(value));
            setIsEditing(false);
            (e.target as HTMLInputElement).blur();
        }
    };



    return (
        <div className={`flex items-center gap-1 ${className}`}>
            <button
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 text-xs"
                onClick={() => onNudge(-0.1)}
                tabIndex={-1}
            >-</button>
            <input
                className="w-20 text-center font-mono text-sm border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent"
                value={text}
                onChange={(e) => {
                    setText(e.target.value);
                    setIsEditing(true);
                }}
                onBlur={commit}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsEditing(true)}
            />
            <button
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 text-xs"
                onClick={() => onNudge(0.1)}
                tabIndex={-1}
            >+</button>
        </div>
    );
}

export function TimingPanel({ lines, currentLineIndex, currentTime, onSeek, onUpdateLine }: TimingPanelProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to current line
    useEffect(() => {
        if (!scrollRef.current) return;
        // Simple logic: maintain 3 lines context? 
        // For now, let's strictly follow only if the user hasn't scrolled away? 
        // Actually, users might edit while playing. Let's just scroll current row into view.
        const row = scrollRef.current.querySelector(`[data-line-index="${currentLineIndex}"]`);
        if (row) {
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [currentLineIndex]);

    return (
        <div className="flex flex-col h-full bg-white border-l border-gray-200 w-full md:w-[600px] shadow-xl z-20">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="font-bold text-gray-700">Timing List</h2>
                <div className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {formatTime(currentTime)}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-0" ref={scrollRef}>
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 sticky top-0 z-10 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <tr>
                            <th className="px-3 py-2 border-b w-12 text-center">#</th>
                            <th className="px-3 py-2 border-b">Text</th>
                            <th className="px-3 py-2 border-b w-32 text-center">Start</th>
                            <th className="px-3 py-2 border-b w-32 text-center">End</th>
                            <th className="px-3 py-2 border-b w-16 text-center">Dur</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {lines.map((line, idx) => {
                            const isActive = idx === currentLineIndex;
                            const duration = (line.endTime && line.startTime) ? (line.endTime - line.startTime).toFixed(1) : '-';

                            return (
                                <tr
                                    key={line.id}
                                    data-line-index={idx}
                                    className={`group transition-colors ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                >
                                    <td className="px-3 py-2 text-center text-xs text-gray-400 font-mono">
                                        {idx + 1}
                                    </td>
                                    <td
                                        className="px-3 py-2 text-sm text-gray-800 break-words max-w-[200px] cursor-pointer"
                                        onClick={() => line.startTime !== undefined && onSeek(line.startTime)}
                                        title="Click to seek"
                                    >
                                        {line.text}
                                        {line.isEndLocked && <span className="ml-2 text-[10px] text-orange-500 font-bold border border-orange-200 px-1 rounded">LOCK</span>}
                                    </td>
                                    <td className="px-1 py-1 text-center">
                                        <TimeInput
                                            value={line.startTime}
                                            onChange={(val) => onUpdateLine(line.id, { startTime: val })}
                                            onNudge={(amt) => onUpdateLine(line.id, { startTime: Math.max(0, (line.startTime || 0) + amt) })}
                                        />
                                    </td>
                                    <td className="px-1 py-1 text-center">
                                        <TimeInput
                                            value={line.endTime}
                                            onChange={(val) => onUpdateLine(line.id, { endTime: val, isEndLocked: true })}
                                            onNudge={(amt) => onUpdateLine(line.id, { endTime: Math.max(0, (line.endTime || 0) + amt), isEndLocked: true })}
                                        />
                                    </td>
                                    <td className="px-3 py-2 text-center text-xs text-gray-400 font-mono">
                                        {duration}s
                                    </td>
                                </tr>
                            );
                        })}
                        {lines.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">
                                    Paste your script to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
