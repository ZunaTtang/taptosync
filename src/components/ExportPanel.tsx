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

  const completedCount = lines.filter(l => l.startTime !== undefined && l.endTime !== undefined).length;
  const hasTimestamps = lines.length > 0 && completedCount === lines.length;
  const remaining = Math.max(0, lines.length - completedCount);

  return (
    <div className="w-full flex flex-col gap-2 min-w-[260px]">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        Export
        <span
          className="w-5 h-5 inline-flex items-center justify-center text-[10px] rounded-full bg-gray-100 text-gray-600"
          title="SRT, LRC, CapCut CSV 3종 포맷을 지원합니다. 모든 라인에 시작/종료 시간이 있어야 활성화됩니다."
        >
          ?
        </span>
      </div>
      <p className="text-xs text-gray-500">
        {hasTimestamps
          ? `모든 포맷을 바로 다운로드할 수 있습니다. (${completedCount}개 라인 완료)`
          : `타임스탬프가 없는 라인이 ${remaining}개 있어 Export 버튼이 잠깁니다.`}
      </p>
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
