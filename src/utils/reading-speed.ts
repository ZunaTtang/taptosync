/**
 * Reading speed calculator for automatic subtitle timing
 * Based on text length and language characteristics
 */

export interface ReadingSpeedConfig {
    /** Characters per second for Korean/CJK text */
    cjkCharsPerSec: number;
    /** Characters per second for Latin/English text */
    latinCharsPerSec: number;
    /** Minimum duration for any line (seconds) */
    minDuration: number;
    /** Maximum duration for any line (seconds) */
    maxDuration: number;
}

const DEFAULT_CONFIG: ReadingSpeedConfig = {
    cjkCharsPerSec: 8,      // Korean/Chinese/Japanese: ~8 chars/sec
    latinCharsPerSec: 15,   // English: ~15 chars/sec (≈ 180 WPM ÷ 60 × 5 chars/word)
    minDuration: 0.8,       // No line shorter than 0.8s
    maxDuration: 6.0,       // No line longer than 6s
};

/**
 * Detect if text is primarily CJK (Korean, Chinese, Japanese)
 */
function isCJKText(text: string): boolean {
    const cjkPattern = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/;
    const cjkChars = (text.match(cjkPattern) || []).length;
    return cjkChars > text.length * 0.3; // If >30% is CJK, treat as CJK text
}

/**
 * Calculate ideal reading duration based on text length
 * 
 * @param text - The subtitle text
 * @param config - Reading speed configuration
 * @returns Duration in seconds
 */
export function calculateReadingDuration(
    text: string,
    config: ReadingSpeedConfig = DEFAULT_CONFIG
): number {
    if (!text || text.trim().length === 0) {
        return config.minDuration;
    }

    const trimmedText = text.trim();
    const charCount = trimmedText.length;

    // Determine reading speed based on text type
    const isCJK = isCJKText(trimmedText);
    const speed = isCJK ? config.cjkCharsPerSec : config.latinCharsPerSec;

    // Calculate base duration
    const baseDuration = charCount / speed;

    // Clamp to min/max bounds
    const duration = Math.max(
        config.minDuration,
        Math.min(config.maxDuration, baseDuration)
    );

    return duration;
}

/**
 * Calculate ideal end time for a line given its start time and text
 * 
 * @param startTime - Start time in seconds
 * @param text - The subtitle text
 * @param config - Reading speed configuration
 * @returns End time in seconds
 */
export function calculateAutoEndTime(
    startTime: number,
    text: string,
    config?: ReadingSpeedConfig
): number {
    const duration = calculateReadingDuration(text, config);
    return startTime + duration;
}
