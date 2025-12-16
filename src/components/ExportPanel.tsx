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
    <div className="w-full space-y-3">
      <p className="text-xs text-gray-600">타임라인에 시작/종료 시간이 모두 채워져야 다운로드가 활성화됩니다.</p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleExportSRT}
          disabled={!hasTimestamps}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          SRT 다운로드
        </button>
        <button
          onClick={handleExportLRC}
          disabled={!hasTimestamps}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          LRC 다운로드
        </button>
        <button
          onClick={handleExportCapCut}
          disabled={!hasTimestamps}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          CapCut CSV 다운로드
        </button>
      </div>
    </div>
  );
}
