import { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';

interface AudioPlayerProps {
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onPlayingChange?: (isPlaying: boolean) => void;
  seekTo?: number | null; // 외부에서 재생 위치 변경 요청
  seekStepSeconds?: number; // 좌우 화살표 이동 간격
  onGetCurrentTime?: () => number; // (사용 안 함, forwardRef로 대체)
}

export interface AudioPlayerRef {
  getCurrentTime: () => number;
}

type PlayerMode = 'file' | 'timer';

export const AudioPlayer = forwardRef<AudioPlayerRef, AudioPlayerProps>(
  ({ onTimeUpdate, onDurationChange, onPlayingChange, seekTo, seekStepSeconds = 0.5 }, ref) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const [mode, setMode] = useState<PlayerMode>('file');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timerDuration, setTimerDuration] = useState<string>(''); // 분:초 형식 입력

  // 오디오 이벤트 리스너 설정
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      // 오디오의 실제 currentTime을 직접 사용 (지연 없이)
      const time = audio.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/41a3d5a8-1690-4b8d-ba87-c41877d5e201',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run4',hypothesisId:'H1',location:'AudioPlayer.tsx:handleTimeUpdate',message:'audio timeupdate',data:{time,paused:audio.paused,duration:audio.duration,mode},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    };
    
    // 더 정확한 시간 업데이트를 위한 추가 이벤트 리스너
    const handleSeeking = () => {
      const time = audio.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/41a3d5a8-1690-4b8d-ba87-c41877d5e201',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run4',hypothesisId:'H2',location:'AudioPlayer.tsx:handleSeeking',message:'audio seeking',data:{time,paused:audio.paused,duration:audio.duration,mode},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    };

    const handleDurationChange = () => {
      const dur = audio.duration;
      if (dur && isFinite(dur) && dur > 0) {
        setDuration(dur);
        onDurationChange?.(dur);
        setIsLoading(false);
      }
    };

    const handleLoadedMetadata = () => {
      handleDurationChange();
      setIsLoading(false);
    };

    const handleLoadedData = () => {
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      handleDurationChange();
    };

    const handleCanPlayThrough = () => {
      setIsLoading(false);
    };

    const handleError = (e: Event) => {
      setIsLoading(false);
      setIsPlaying(false);
      console.error('오디오 오류:', e);
      setError('오디오 파일을 로드할 수 없습니다.');
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setError(null);
      setIsLoading(false);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('seeking', handleSeeking);
    audio.addEventListener('seeked', handleSeeking);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('error', handleError);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    // 더 정확한 시간 업데이트를 위한 주기적 체크 (timeupdate는 약 250ms마다 발생)
    const intervalId = setInterval(() => {
      if (!audio.paused && audio.duration) {
        const time = audio.currentTime;
        setCurrentTime(time);
        onTimeUpdate?.(time);
      }
    }, 50); // 50ms마다 체크하여 더 정확한 동기화

    return () => {
      clearInterval(intervalId);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('seeking', handleSeeking);
      audio.removeEventListener('seeked', handleSeeking);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onTimeUpdate, onDurationChange]);

  // 현재 시간을 가져오는 함수 (외부에서 호출 가능)
  const getCurrentTime = (): number => {
    if (mode === 'timer') {
      return currentTime;
    } else {
      const audio = audioRef.current;
      if (audio && audio.duration) {
        // 오디오의 실제 currentTime을 직접 반환 (가장 정확)
        return audio.currentTime;
      }
      return currentTime;
    }
  };

  // 외부에서 getCurrentTime 함수에 접근할 수 있도록 ref 노출
  useImperativeHandle(ref, () => ({
    getCurrentTime,
  }));

  // 오디오 준비 상태 주기적 확인 (로딩 상태 해제를 위한 안전장치)
  useEffect(() => {
    if (!audioFile || !isLoading) return;

    const audio = audioRef.current;
    if (!audio) return;

    const interval = setInterval(() => {
      if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
        setIsLoading(false);
        if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
          setDuration(audio.duration);
          onDurationChange?.(audio.duration);
        }
        clearInterval(interval);
      }
    }, 100);

    // 3초 후 강제 해제
    const timeout = setTimeout(() => {
      setIsLoading(false);
      clearInterval(interval);
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [audioFile, isLoading, onDurationChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const audio = audioRef.current;
    
    if (file) {
      // 파일 타입 체크를 더 유연하게
      if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i)) {
        setError('지원하지 않는 파일 형식입니다. 오디오 파일을 선택해주세요.');
        return;
      }
      
      setError(null);
      setAudioFile(file);
      setIsLoading(true);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      
      // 기존 URL 정리
      if (audio && audio.src) {
        URL.revokeObjectURL(audio.src);
      }
      
      if (audio) {
        const url = URL.createObjectURL(file);
        audio.src = url;
        audio.load(); // 명시적으로 로드
        
        // 즉시 readyState 확인
        const checkReady = () => {
          if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
            setIsLoading(false);
            if (audio.duration && isFinite(audio.duration)) {
              setDuration(audio.duration);
              onDurationChange?.(audio.duration);
            }
          } else {
            // 아직 준비되지 않았으면 조금 후 다시 확인
            setTimeout(checkReady, 100);
          }
        };
        
        // 짧은 지연 후 확인 (이벤트가 발생할 시간을 줌)
        setTimeout(checkReady, 50);
        
        // 최대 3초 후 강제로 로딩 해제 (안전장치)
        setTimeout(() => {
          setIsLoading(false);
        }, 3000);
      }
    } else {
      // 파일이 선택되지 않았을 때
      if (audio && audio.src) {
        URL.revokeObjectURL(audio.src);
        audio.src = '';
      }
      setAudioFile(null);
      setIsLoading(false);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }
  };

  // 타이머 모드에서 시간 업데이트
  const timerStartTimeRef = useRef<number>(0);
  const timerStartOffsetRef = useRef<number>(0);

  useEffect(() => {
    if (mode === 'timer' && isPlaying && duration > 0) {
      // 재생 시작 시점 기록
      if (timerStartTimeRef.current === 0) {
        timerStartTimeRef.current = Date.now();
        timerStartOffsetRef.current = currentTime;
      }
      
      timerIntervalRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - timerStartTimeRef.current) / 1000;
        const next = Math.min(timerStartOffsetRef.current + elapsed, duration);
        
        if (next >= duration) {
          setIsPlaying(false);
          setCurrentTime(duration);
          onTimeUpdate?.(duration);
          timerStartTimeRef.current = 0;
          timerStartOffsetRef.current = 0;
        } else {
          setCurrentTime(next);
          onTimeUpdate?.(next);
        }
      }, 50); // 더 정확한 동기화를 위해 50ms로 변경
    } else {
      // 일시정지 시 현재 시간 저장
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (!isPlaying && mode === 'timer') {
        timerStartTimeRef.current = 0;
        timerStartOffsetRef.current = currentTime;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [mode, isPlaying, duration, onTimeUpdate, currentTime]);

  // 시간 문자열을 초로 변환 (예: "1:30" -> 90)
  const parseTimeString = (timeStr: string): number => {
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0], 10) || 0;
      const seconds = parseFloat(parts[1]) || 0;
      return minutes * 60 + seconds;
    } else if (parts.length === 1) {
      // 초만 입력한 경우
      return parseFloat(parts[0]) || 0;
    }
    return 0;
  };

  const handleTimerDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimerDuration(e.target.value);
  };

  const handleSetTimerMode = () => {
    const seconds = parseTimeString(timerDuration);
    if (seconds <= 0) {
      setError('올바른 시간을 입력해주세요. (예: 1:30 또는 90)');
      return;
    }
    setError(null);
    setMode('timer');
    setDuration(seconds);
    setCurrentTime(0);
    setIsPlaying(false);
    setAudioFile(null);
    timerStartTimeRef.current = 0;
    timerStartOffsetRef.current = 0;
    onDurationChange?.(seconds);
  };

  // isPlaying 상태 변경 시 외부에 알림
  useEffect(() => {
    onPlayingChange?.(isPlaying);
  }, [isPlaying, onPlayingChange]);

  // 외부에서 seekTo 요청 처리
  useEffect(() => {
    if (seekTo !== null && seekTo !== undefined) {
      if (mode === 'timer') {
        const clampedTime = Math.max(0, duration > 0 ? Math.min(seekTo, duration) : seekTo);
        timerStartOffsetRef.current = clampedTime;
        timerStartTimeRef.current = isPlaying ? Date.now() : 0;
        setCurrentTime(clampedTime);
        onTimeUpdate?.(clampedTime);
      } else {
        const audio = audioRef.current;
        if (audio && audio.duration) {
          const clampedTime = Math.max(0, Math.min(seekTo, audio.duration));
          audio.currentTime = clampedTime;
          setCurrentTime(clampedTime);
          onTimeUpdate?.(clampedTime);
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/41a3d5a8-1690-4b8d-ba87-c41877d5e201',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run3',hypothesisId:'H_seek',location:'AudioPlayer.tsx:seekTo',message:'apply seekTo',data:{seekTo:clampedTime,from:'prop'},timestamp:Date.now()})}).catch(()=>{});
          // #endregion
        }
      }
    }
  }, [seekTo, mode, onTimeUpdate, duration, isPlaying]);

  // 좌우 화살표 키로 0.1초 단위 이동
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력 필드에 포커스가 있으면 무시
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const delta = e.key === 'ArrowLeft' ? -seekStepSeconds : seekStepSeconds;
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/41a3d5a8-1690-4b8d-ba87-c41877d5e201',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run3',hypothesisId:'H_seek',location:'AudioPlayer.tsx:keydown',message:'arrow seek',data:{delta,mode},timestamp:Date.now()})}).catch(()=>{});
        // #endregion

        if (mode === 'timer') {
          const newTime = Math.max(0, Math.min(currentTime + delta, duration));
          timerStartOffsetRef.current = newTime;
          timerStartTimeRef.current = isPlaying ? Date.now() : 0;
          setCurrentTime(newTime);
          onTimeUpdate?.(newTime);
        } else {
          const audio = audioRef.current;
          if (audio && audio.duration) {
            const newTime = Math.max(0, Math.min(audio.currentTime + delta, audio.duration));
            audio.currentTime = newTime;
            setCurrentTime(newTime);
            onTimeUpdate?.(newTime);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mode, currentTime, duration, onTimeUpdate, isPlaying, seekStepSeconds]);

  const togglePlay = async () => {
    if (mode === 'timer') {
      // 타이머 모드
      if (duration <= 0) return;
      setIsPlaying(!isPlaying);
    } else {
      // 파일 모드
      const audio = audioRef.current;
      if (!audio || !audioFile) return;

      try {
        if (isPlaying) {
          audio.pause();
          // pause는 동기적으로 실행되므로 즉시 상태 업데이트
          setIsPlaying(false);
        } else {
          // 재생 시도
          await audio.play();
          // play()가 성공하면 play 이벤트가 발생하지만, 
          // 이벤트가 발생하지 않는 경우를 대비해 짧은 지연 후 확인
          setTimeout(() => {
            if (!audio.paused && !isPlaying) {
              setIsPlaying(true);
            }
          }, 50);
          // 즉시 상태 업데이트 (play 이벤트 핸들러와 중복되지만 안전하게)
          setIsPlaying(true);
        }
      } catch (err) {
        console.error('재생 오류:', err);
        setError('오디오 재생에 실패했습니다. 브라우저가 오디오 재생을 허용하지 않을 수 있습니다.');
        setIsPlaying(false);
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        오디오 소스 선택
      </label>
      
      {/* 모드 선택 스위치 */}
      <div className="mb-4 flex items-center gap-3">
        <span className={`text-sm font-medium transition-colors ${
          mode === 'file' ? 'text-gray-700' : 'text-gray-400'
        }`}>
          파일 업로드
        </span>
        <button
          type="button"
          onClick={() => {
            if (mode === 'file') {
              setMode('timer');
              setAudioFile(null);
            } else {
              setMode('file');
              setTimerDuration('');
            }
            setError(null);
          }}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            mode === 'file' ? 'bg-blue-600' : 'bg-gray-300'
          }`}
          role="switch"
          aria-checked={mode === 'file'}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              mode === 'file' ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span className={`text-sm font-medium transition-colors ${
          mode === 'timer' ? 'text-gray-700' : 'text-gray-400'
        }`}>
          파일 없이 시작
        </span>
      </div>

      {mode === 'file' ? (
        <>
          <input
            type="file"
            accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.webm"
            onChange={handleFileChange}
            className="mb-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          
          {/* 오디오 요소는 항상 렌더링 (hidden) */}
          <audio ref={audioRef} className="hidden" preload="metadata" />
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          {audioFile && (
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <button
                  onClick={togglePlay}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? '로딩 중...' : isPlaying ? '일시정지' : '재생'}
                </button>
                <span className="text-sm text-gray-600">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
                <span className="text-xs text-gray-500 truncate max-w-xs">
                  {audioFile.name}
                </span>
              </div>
              {duration > 0 && (
                <input
                  type="range"
                  min="0"
                  max={duration}
                  value={currentTime}
                  onChange={(e) => {
                    const time = parseFloat(e.target.value);
                    if (audioRef.current) {
                      audioRef.current.currentTime = time;
                      setCurrentTime(time);
                    }
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              재생 시간 입력 (예: 1:30 또는 90)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={timerDuration}
                onChange={handleTimerDurationChange}
                placeholder="1:30 또는 90"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleSetTimerMode}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                설정
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              분:초 형식 (예: 1:30) 또는 초 단위 (예: 90)로 입력하세요
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {duration > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <button
                  onClick={togglePlay}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {isPlaying ? '일시정지' : '재생'}
                </button>
                <span className="text-sm text-gray-600">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
                <span className="text-xs text-gray-500">
                  타이머 모드
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={(e) => {
                  const time = parseFloat(e.target.value);
                  setCurrentTime(time);
                  onTimeUpdate?.(time);
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
});

AudioPlayer.displayName = 'AudioPlayer';
