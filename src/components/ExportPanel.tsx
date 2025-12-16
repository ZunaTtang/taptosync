import { formatSRT } from '@/features/export/srt';
import { formatLRC } from '@/features/export/lrc';
import { formatCapCutCSV } from '@/features/export/capcut-csv';
import type { Line } from '@/models/line';

interface ExportPanelProps {
  lines: Line[];
}

export function ExportPanel({ lines }: ExportPanelProps) {
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

  return (
    <div className="w-full card">
      <div className="card-header">
        <div>
          <p className="card-title">Export</p>
          <p className="card-subtitle">완료된 타임라인을 다양한 포맷으로 저장하세요</p>
        </div>
        <span className="section-pill" aria-live="polite">
          {hasTimestamps ? '준비 완료' : '타임라인 필요'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleExportSRT}
          disabled={!hasTimestamps}
          title={!hasTimestamps ? '시작·종료 시간이 모두 입력되면 다운로드할 수 있습니다.' : undefined}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus-ring disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
        >
          SRT 다운로드
        </button>
        <button
          onClick={handleExportLRC}
          disabled={!hasTimestamps}
          title={!hasTimestamps ? '시작·종료 시간이 모두 입력되면 다운로드할 수 있습니다.' : undefined}
          className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 focus-ring disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
        >
          LRC 다운로드
        </button>
        <button
          onClick={handleExportCapCut}
          disabled={!hasTimestamps}
          title={!hasTimestamps ? '시작·종료 시간이 모두 입력되면 다운로드할 수 있습니다.' : undefined}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus-ring disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
        >
          CapCut CSV 다운로드
        </button>
      </div>
    </div>
  );
}
