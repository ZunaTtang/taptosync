import { useState } from 'react';


export interface SetupTrayProps {
    onAudioSetup: (file: File | null, duration: number) => void;
    onTextSetup: (text: string) => void;
    audioName: string | null;
    hasText: boolean;
    viewMode: 'deck' | 'list';
    onToggleView: (mode: 'deck' | 'list') => void;
    timingMode: 'smart' | 'manual';
    onToggleTimingMode: (mode: 'smart' | 'manual') => void;
}

export function SetupTray({ onAudioSetup, onTextSetup, audioName, hasText, viewMode, onToggleView, timingMode, onToggleTimingMode }: SetupTrayProps) {
    const [isOpen, setIsOpen] = useState(true);
    const [textInput, setTextInput] = useState('');
    const [timerInput, setTimerInput] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onAudioSetup(file, 0);
        }
    };

    const handleTimerSet = () => {
        const parts = timerInput.split(':');
        let sec = 0;
        if (parts.length === 2) {
            sec = parseInt(parts[0], 10) * 60 + parseFloat(parts[1]);
        } else {
            sec = parseFloat(parts[0]);
        }
        if (sec > 0) onAudioSetup(null, sec);
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setTextInput(e.target.value);
        onTextSetup(e.target.value);
    };

    return (
        <div className="bg-white border-b border-gray-200 transition-all duration-300 ease-in-out shadow-sm z-30">
            {/* Header / Toggle */}
            <div className="px-4 py-2 flex items-center justify-between bg-gray-50">
                <div
                    className="flex items-center gap-3 cursor-pointer hover:text-gray-900"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <span className="text-sm font-semibold text-gray-700">⚙️ Project Setup</span>
                    {audioName && <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs">{audioName}</span>}
                    {hasText && <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs">Text Ready</span>}
                    <span className="text-gray-400 text-xs ml-2">{isOpen ? '▼' : '▶'}</span>
                </div>

                <div className="flex items-center gap-4">
                    {/* Timing Mode Toggle */}
                    <div className="flex bg-gray-200 rounded-lg p-0.5">
                        <button
                            onClick={() => onToggleTimingMode('smart')}
                            title="1-Tap Smart Sync"
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${timingMode === 'smart'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            ⚡ Smart Tap
                        </button>
                        <button
                            onClick={() => onToggleTimingMode('manual')}
                            title="2-Tap Start/End"
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${timingMode === 'manual'
                                ? 'bg-white text-purple-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            🎯 Manual End
                        </button>
                    </div>

                    {/* View Toggles */}
                    <div className="flex bg-gray-200 rounded-lg p-0.5">
                        <button
                            onClick={() => onToggleView('deck')}
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${viewMode === 'deck'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Active Deck
                        </button>
                        <button
                            onClick={() => onToggleView('list')}
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${viewMode === 'list'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Timing List
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {
                isOpen && (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Audio Section */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Audio Source</h3>
                            <div className="flex flex-col gap-3">
                                {/* File Input */}
                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        accept="audio/*"
                                        onChange={handleFileChange}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                </div>
                                {/* OR Timer */}
                                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                    <span className="text-xs text-gray-400">OR Timer:</span>
                                    <input
                                        type="text"
                                        placeholder="mm:ss"
                                        value={timerInput}
                                        onChange={e => setTimerInput(e.target.value)}
                                        className="w-20 px-2 py-1 text-sm border rounded"
                                    />
                                    <button onClick={handleTimerSet} className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200">Set</button>
                                </div>
                            </div>
                        </div>

                        {/* Text Section */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Lyrics / Text</h3>
                            <textarea
                                value={textInput}
                                onChange={handleTextChange}
                                placeholder="Paste your text here..."
                                className="w-full h-24 text-sm p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            />
                        </div>
                    </div>
                )
            }
        </div >
    );
}
