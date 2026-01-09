import type { Line } from '@/models/line';

interface ActiveDeckProps {
    currentLine: Line | undefined;
    prevLine: Line | undefined;
    nextLine: Line | undefined;
    isPlaying: boolean;
    timingMode: 'smart' | 'manual';
    manualTapState: 'start' | 'end';
}

export function ActiveDeck({ currentLine, prevLine, nextLine, isPlaying, timingMode, manualTapState }: ActiveDeckProps) {
    const isComplete = currentLine && currentLine.startTime !== undefined && currentLine.endTime !== undefined;

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50/50 relative overflow-hidden">
            {/* Background Hint */}
            <div className={`absolute inset-0 opacity-5 pointer-events-none transition-colors duration-300 ${isPlaying ? 'bg-blue-500' : 'bg-gray-200'
                }`} />

            {/* Previous Line (Context) */}
            <div className="text-gray-300 text-lg mb-6 select-none transition-all blur-[1px]">
                {prevLine?.text || "..."}
            </div>

            {/* Current Line (Hero) */}
            <div className={`relative z-10 max-w-4xl w-full text-center transition-all duration-200 transform ${isPlaying ? 'scale-100' : 'scale-95 opacity-80'
                }`}>
                {currentLine ? (
                    <h1 className="text-3xl md:text-5xl font-bold text-gray-800 leading-tight">
                        {currentLine.text}
                    </h1>
                ) : (
                    <h1 className="text-3xl font-bold text-gray-300">
                        Waiting for text or playback...
                    </h1>
                )}

                {/* Status Indicator */}
                {currentLine && (
                    <div className="mt-8 flex justify-center">
                        {timingMode === 'smart' ? (
                            <div className={`flex items-center gap-3 px-6 py-3 rounded-full border-2 transition-all ${isComplete
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-blue-200 bg-blue-50 text-blue-700'
                                }`}>
                                <div className={`w-3 h-3 rounded-full ${isComplete ? 'bg-green-500' : 'bg-blue-400 animate-pulse'}`} />
                                <span className="font-mono text-sm font-bold">
                                    {isComplete ? '✓ TIMING COMPLETE' : 'SMART TAP: Press I/O to Sync'}
                                </span>
                            </div>
                        ) : (
                            // Manual Mode UI
                            <div className={`flex items-center gap-3 px-6 py-3 rounded-full border-2 transition-all ${manualTapState === 'start'
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700' // Ready to Start
                                    : 'border-rose-200 bg-rose-50 text-rose-700 animate-pulse' // Recording (Waiting for End)
                                }`}>
                                <div className={`w-3 h-3 rounded-full ${manualTapState === 'start' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                <span className="font-mono text-sm font-bold">
                                    {manualTapState === 'start' ? 'TAP TO START (Line Ready)' : 'RECORDING... TAP TO END'}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Next Line (Context) */}
            <div className="text-gray-300 text-lg mt-6 select-none transition-all blur-[1px]">
                {nextLine?.text || "..."}
            </div>
        </div>
    );
}
