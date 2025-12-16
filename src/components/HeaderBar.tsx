import { ExportPanel } from './ExportPanel';
import type { Line } from '@/models/line';

interface HeaderBarProps {
  lines: Line[];
}

export function HeaderBar({ lines }: HeaderBarProps) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 border-b border-gray-200 bg-[color:var(--color-surface)]/95 backdrop-blur"
      style={{ height: 'var(--header-height)' }}
    >
      <div className="app-container mx-auto flex h-full items-center justify-between gap-3 px-4 py-2">
        <div className="flex flex-col justify-center gap-1">
          <h1 className="text-lg font-semibold text-gray-900">TapSync Studio</h1>
          <p className="text-xs text-gray-600">텍스트 입력 → 탭 → 타임라인 보정 → Export</p>
        </div>
        <ExportPanel lines={lines} compact />
      </div>
    </header>
  );
}
