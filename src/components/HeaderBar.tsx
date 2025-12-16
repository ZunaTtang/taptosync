import { ExportPanel } from './ExportPanel';
import type { Line } from '@/models/line';

interface HeaderBarProps {
  lines: Line[];
}

export function HeaderBar({ lines }: HeaderBarProps) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 border-b border-gray-200 bg-[color:var(--color-surface)]/95 backdrop-blur"
      style={{ minHeight: 'var(--header-height)' }}
    >
      <div className="app-container mx-auto flex h-full flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-blue-700">Tap-to-Sync Studio</p>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <h1 className="text-2xl font-bold text-gray-900">TapSync Studio</h1>
            <span className="hidden text-xs text-gray-400 lg:inline" aria-hidden>
              ·
            </span>
            <span className="text-xs text-gray-600">텍스트 입력 → 탭 기록 → 타임라인 보정 → Export</span>
          </div>
        </div>
        <div className="flex items-center justify-end">
          <ExportPanel lines={lines} compact />
        </div>
      </div>
    </header>
  );
}
