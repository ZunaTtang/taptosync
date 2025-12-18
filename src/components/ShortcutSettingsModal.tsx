import { useEffect, useState, type KeyboardEvent } from 'react';

export type ShortcutConfig = {
  start: string;
  end: string;
  next?: string;
};

interface ShortcutSettingsModalProps {
  initialConfig: ShortcutConfig;
  onSave: (config: ShortcutConfig) => void;
  onClose: () => void;
}

const disallowedKeys = [' ', 'space', 'spacebar'];

const formatKey = (key: string) => {
  if (!key) return '';
  if (key === ' ') return 'Space';
  if (key.toLowerCase() === 'spacebar' || key.toLowerCase() === 'space') return 'Space';
  return key.length === 1 ? key.toUpperCase() : key;
};

export function ShortcutSettingsModal({ initialConfig, onSave, onClose }: ShortcutSettingsModalProps) {
  const [start, setStart] = useState(initialConfig.start || 'i');
  const [end, setEnd] = useState(initialConfig.end || 'o');
  const [next, setNext] = useState(initialConfig.next || 'ArrowDown');
  const [error, setError] = useState('');

  useEffect(() => {
    setStart(initialConfig.start || 'i');
    setEnd(initialConfig.end || 'o');
    setNext(initialConfig.next || 'ArrowDown');
  }, [initialConfig]);

  const handleCapture = (setter: (key: string) => void) => (e: KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const key = e.key === ' ' ? 'Space' : e.key;
    setter(key);
    setError('');
  };

  const validate = (): ShortcutConfig | null => {
    const normalizedStart = start.trim();
    const normalizedEnd = end.trim();
    const normalizedNext = next.trim();
    const lowerStart = normalizedStart.toLowerCase();
    const lowerEnd = normalizedEnd.toLowerCase();
    const lowerNext = normalizedNext.toLowerCase();

    if (!normalizedStart || !normalizedEnd) {
      setError('시작/종료 단축키를 모두 설정하세요.');
      return null;
    }

    if (disallowedKeys.includes(lowerStart) || disallowedKeys.includes(lowerEnd)) {
      setError('Spacebar는 재생/일시정지 전용입니다. 다른 키를 선택하세요.');
      return null;
    }

    if (lowerStart === lowerEnd) {
      setError('시작/종료 단축키가 같을 수 없습니다.');
      return null;
    }

    if (lowerNext && (lowerNext === lowerStart || lowerNext === lowerEnd || disallowedKeys.includes(lowerNext))) {
      setError('다음 라인 단축키는 시작/종료 및 Spacebar와 달라야 합니다.');
      return null;
    }

    return {
      start: normalizedStart,
      end: normalizedEnd,
      next: normalizedNext,
    };
  };

  const handleSave = () => {
    const config = validate();
    if (!config) return;
    onSave(config);
    onClose();
  };

  const renderInput = (
    label: string,
    value: string,
    setter: (key: string) => void,
    description?: string,
  ) => (
    <label className="flex flex-col gap-1 text-sm text-gray-800">
      <span className="font-semibold">{label}</span>
      <input
        type="text"
        value={formatKey(value)}
        onKeyDown={handleCapture(setter)}
        readOnly
        className="w-full rounded-lg border border-gray-200 px-3 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="키를 눌러 설정"
        aria-label={label}
      />
      {description && <span className="text-xs text-gray-500">{description}</span>}
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-gray-900">단축키 설정</p>
            <p className="text-sm text-gray-600">Spacebar는 재생/일시정지 전용입니다.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 py-1 text-gray-500 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {renderInput('시작 마커', start, setStart, '기본: I')}
          {renderInput('종료 마커', end, setEnd, '기본: O')}
          {renderInput('다음 라인 이동 (선택)', next, setNext, '기본: ArrowDown 또는 Enter')}
        </div>

        {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setStart('i');
              setEnd('o');
              setNext('ArrowDown');
              setError('');
            }}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            기본값으로 재설정
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

