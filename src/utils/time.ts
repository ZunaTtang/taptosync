/**
 * Time formatting and parsing utilities
 */

/**
 * Format seconds to MM:SS.mmm
 * e.g. 65.5 -> "01:05.500"
 */
export function formatTime(seconds: number | undefined): string {
    if (seconds === undefined || isNaN(seconds)) return '';

    const absSeconds = Math.abs(seconds);
    const minutes = Math.floor(absSeconds / 60);
    const secs = Math.floor(absSeconds % 60);
    const ms = Math.floor((absSeconds % 1) * 1000);

    const sign = seconds < 0 ? '-' : '';

    return `${sign}${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

/**
 * Parse MM:SS.mmm or SS.mmm string to seconds
 * Returns null if invalid
 */
export function parseTime(timeStr: string): number | null {
    if (!timeStr) return null;

    const parts = timeStr.split(':');

    if (parts.length === 2) {
        // MM:SS.mmm
        const minutes = parseFloat(parts[0]);
        const seconds = parseFloat(parts[1]);
        if (isNaN(minutes) || isNaN(seconds)) return null;
        return minutes * 60 + seconds;
    } else if (parts.length === 1) {
        // SS.mmm
        const seconds = parseFloat(parts[0]);
        if (isNaN(seconds)) return null;
        return seconds;
    }

    return null;
}
