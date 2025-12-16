import { formatSRT } from '@/features/export/srt';
import { formatLRC } from '@/features/export/lrc';
import { formatCapCutCSV } from '@/features/export/capcut-csv';
import type { Line } from '@/models/line';

interface ExportPanelProps {
  lines: Line[];
  compact?: boolean;
}

export function ExportPanel({ lines, compact = false }: ExportPanelProps) {
  const handleDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportSRT = () => {
    const srt = formatSRT(lines);
    handleDownload(srt, 'subtitles.srt', 'text/plain');
  };

  const handleExportLRC = () => {
    const lrc = formatLRC(lines);
    handleDownload(lrc, 'lyrics.lrc', 'text/plain');
  };

  const handleExportCapCut = () => {
    const csv = formatCapCutCSV(lines);
    handleDownload(csv, 'capcut.csv', 'text/csv');
  };

  const hasTimestamps = lines.some(l => l.startTime !== undefined && l.endTime !== undefined);

  const layoutClass = compact
    ? 'app-card flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4'
    : 'app-card space-y-3';

  return (
    <div className={layoutClass} aria-label="자막 Export 영역">
      <div className="section-header mb-0">
        <div>
          <p className="section-title">Export</p>
          <p className="text-xs text-gray-500">SRT · LRC · CapCut CSV</p>
        </div>
        <span className={`px-3 py-1 text-xs rounded-full border ${hasTimestamps ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
          {hasTimestamps ? '다운로드 준비 완료' : '타임스탬프 필요'}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 justify-start lg:justify-end">
        <button
          onClick={handleExportSRT}
          disabled={!hasTimestamps}
          className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          aria-disabled={!hasTimestamps}
          title={!hasTimestamps ? '모든 라인의 시작/종료 시간을 채워주세요.' : 'SRT 포맷으로 다운로드'}
        >
          SRT 다운로드
        </button>
        <button
          onClick={handleExportLRC}
          disabled={!hasTimestamps}
          className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          aria-disabled={!hasTimestamps}
          title={!hasTimestamps ? '모든 라인의 시작/종료 시간을 채워주세요.' : 'LRC 포맷으로 다운로드'}
        >
          LRC 다운로드
        </button>
        <button
          onClick={handleExportCapCut}
          disabled={!hasTimestamps}
          className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          aria-disabled={!hasTimestamps}
          title={!hasTimestamps ? '모든 라인의 시작/종료 시간을 채워주세요.' : 'CapCut CSV 포맷으로 다운로드'}
        >
          CapCut CSV 다운로드
        </button>
      </div>
      {!hasTimestamps && (
        <p className="text-xs text-gray-500">모든 라인의 시작·종료 시간이 입력되면 버튼이 활성화됩니다.</p>
      )}
    </div>
  );
}
