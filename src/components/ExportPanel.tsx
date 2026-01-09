import { useEffect, useRef, useState } from 'react';
import { formatSRT } from '@/features/export/srt';
import { formatLRC } from '@/features/export/lrc';
import { formatCapCutCSV } from '@/features/export/capcut-csv';
import { formatFCP7XML_Premiere, formatFCPXML } from '@/features/export/xml-export';
import type { Line } from '@/models/line';

interface ExportPanelProps {
  lines: Line[];
  compact?: boolean;
}

export function ExportPanel({ lines, compact = false }: ExportPanelProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

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
    setOpen(false);
  };

  const handleExportLRC = () => {
    const lrc = formatLRC(lines);
    handleDownload(lrc, 'lyrics.lrc', 'text/plain');
    setOpen(false);
  };

  const handleExportCapCut = () => {
    const csv = formatCapCutCSV(lines);
    handleDownload(csv, 'capcut.csv', 'text/csv');
    setOpen(false);
  };

  const handleExportPremiereXML = () => {
    const xml = formatFCP7XML_Premiere(lines);
    handleDownload(xml, 'premiere_markers.xml', 'text/xml');
    setOpen(false);
  };

  const handleExportFCPXML = () => {
    const xml = formatFCPXML(lines);
    handleDownload(xml, 'project.fcpxml', 'text/xml');
    setOpen(false);
  };

  const hasTimestamps = lines.some(l => l.startTime !== undefined && l.endTime !== undefined);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  if (compact) {
    return (
      <div className="relative inline-flex items-center gap-2" aria-label="자막 Export 영역" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          disabled={!hasTimestamps}
          aria-haspopup="menu"
          aria-expanded={open}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          title={!hasTimestamps ? '모든 라인의 시작/종료 시간을 채워주세요.' : '다운로드 포맷 선택'}
        >
          다운로드
          <span aria-hidden className="text-xs text-gray-500">▾</span>
        </button>
        <span className={`hidden rounded-full border px-3 py-1 text-[11px] font-semibold lg:inline ${hasTimestamps ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
          {hasTimestamps ? '준비 완료' : '타임스탬프 필요'}
        </span>
        {open && (
          <div
            role="menu"
            className="absolute right-0 top-full mt-2 w-40 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
          >
            <button
              role="menuitem"
              onClick={handleExportSRT}
              className="block w-full px-4 py-2 text-left text-sm text-gray-800 hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
            >
              SRT
            </button>
            <button
              role="menuitem"
              onClick={handleExportLRC}
              className="block w-full px-4 py-2 text-left text-sm text-gray-800 hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
            >
              LRC
            </button>
            <button
              role="menuitem"
              onClick={handleExportCapCut}
              className="block w-full px-4 py-2 text-left text-sm text-gray-800 hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
            >
              CapCut CSV
            </button>
            <div className="border-t border-gray-100 my-1"></div>
            <button
              role="menuitem"
              onClick={handleExportPremiereXML}
              className="block w-full px-4 py-2 text-left text-sm text-gray-800 hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
            >
              Premiere Pro XML
            </button>
            <button
              role="menuitem"
              onClick={handleExportFCPXML}
              className="block w-full px-4 py-2 text-left text-sm text-gray-800 hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
            >
              Final Cut Pro XML
            </button>
          </div>
        )}
        {!hasTimestamps && (
          <p className="pl-1 text-[11px] text-gray-500">모든 라인의 시작·종료 시간을 입력해주세요.</p>
        )}
      </div>
    );
  }

  return (
    <div className="app-card space-y-3" aria-label="자막 Export 영역">
      <div className="section-header mb-0">
        <div>
          <p className="section-title">Export</p>
          <p className="text-xs text-gray-500">SRT · LRC · CSV</p>
        </div>
        <span className={`px-3 py-1 text-xs rounded-full border ${hasTimestamps ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
          {hasTimestamps ? '다운로드 준비' : '타임스탬프 필요'}
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
        <button
          onClick={handleExportPremiereXML}
          disabled={!hasTimestamps}
          className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          aria-disabled={!hasTimestamps}
          title={!hasTimestamps ? '모든 라인의 시작/종료 시간을 채워주세요.' : 'Premiere Pro Markers XML 다운로드'}
        >
          Premiere XML (FCP7)
        </button>
        <button
          onClick={handleExportFCPXML}
          disabled={!hasTimestamps}
          className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          aria-disabled={!hasTimestamps}
          title={!hasTimestamps ? '모든 라인의 시작/종료 시간을 채워주세요.' : 'Final Cut Pro XML 다운로드'}
        >
          FCPXML
        </button>
      </div>
      {
        !hasTimestamps && (
          <p className="text-xs text-gray-500">모든 라인의 시작·종료 시간이 입력되면 버튼이 활성화됩니다.</p>
        )
      }
    </div >
  );
}
