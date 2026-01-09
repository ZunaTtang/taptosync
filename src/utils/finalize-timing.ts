import type { Line } from '@/models/line';

/**
 * Finalize the last line's end time
 * - If very close to audio end (<0.5s): extend to duration
 * - Otherwise: keep auto-calculated end (don't fill long silence)
 */
export function finalizeLastLine(lines: Line[], audioDuration: number): Line[] {
    if (lines.length === 0) return lines;

    const lastLine = lines[lines.length - 1];
    if (!lastLine.startTime || !lastLine.endTime) return lines;

    const remaining = audioDuration - lastLine.startTime;
    const autoEnd = lastLine.endTime;

    let finalEnd: number;

    if (remaining < 0.5) {
        // Very end of audio, extend to duration
        finalEnd = audioDuration;
    } else {
        // Keep auto-calculated, but cap at audio duration
        finalEnd = Math.min(autoEnd, audioDuration);
    }

    return lines.map((line, idx) =>
        idx === lines.length - 1
            ? { ...line, endTime: finalEnd }
            : line
    );
}
