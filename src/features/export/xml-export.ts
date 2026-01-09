import { js2xml } from 'xml-js';
import type { Line } from '@/models/line';

// Premiere-compatible FCP7 XML
export function formatFCP7XML_Premiere(lines: Line[], fps: number = 30): string {
    const timebase = Math.round(fps);
    const durationFrames = Math.ceil((lines[lines.length - 1]?.endTime ?? 0) * timebase) + 100;

    const markers = lines.map((line, idx) => ({
        comment: { _text: line.text }, // Premiere maps 'name' to Name, 'comment' to Description
        name: { _text: `L${idx + 1}` },
        in: { _text: Math.round((line.startTime ?? 0) * timebase) },
        out: { _text: Math.round((line.endTime ?? 0) * timebase) }, // Marker duration
    }));

    const xml = {
        _declaration: { _attributes: { version: '1.0', encoding: 'UTF-8' } },
        xmeml: {
            _attributes: { version: '4' },
            sequence: {
                name: { _text: 'Synced Sequence' },
                duration: { _text: durationFrames },
                rate: {
                    timebase: { _text: timebase },
                    ntsc: { _text: 'FALSE' }
                },
                media: {
                    video: {
                        track: {
                            clipitem: {
                                id: { _text: 'slug' },
                                name: { _text: 'Markers' },
                                duration: { _text: durationFrames },
                                rate: {
                                    timebase: { _text: timebase },
                                    ntsc: { _text: 'FALSE' }
                                },
                                start: { _text: 0 },
                                end: { _text: durationFrames },
                                file: {
                                    id: { _text: 'file-1' },
                                    name: { _text: 'Slug' },
                                    media: {
                                        video: {
                                            duration: { _text: durationFrames },
                                            samplecharacteristics: {
                                                width: { _text: 1920 },
                                                height: { _text: 1080 }
                                            }
                                        }
                                    }
                                },
                                marker: markers
                            }
                        }
                    }
                }
            }
        }
    };

    return js2xml(xml, { compact: true, spaces: 4 });
}

// Final Cut Pro X (FCPXML) - Totally different format
export function formatFCPXML(lines: Line[], fps: number = 30): string {
    // FCPXML uses rational time (e.g., "1001/30000s")
    // Simple 30fps = "1/30s"
    const frameDuration = `1/${fps}s`;

    const projectDuration = Math.ceil((lines[lines.length - 1]?.endTime ?? 0) * fps);

    const markers = lines.map((line, idx) => ({
        _attributes: {
            start: `${Math.round((line.startTime ?? 0) * fps)}/${fps}s`,
            duration: `${Math.round(((line.endTime ?? 0) - (line.startTime ?? 0)) * fps)}/${fps}s`,
            value: line.text,
            note: `Line ${idx + 1}`
        }
    }));

    const xml = {
        _declaration: { _attributes: { version: '1.0', encoding: 'UTF-8' } },
        fcpxml: {
            _attributes: { version: '1.9' },
            resources: {
                format: { _attributes: { id: 'r1', name: `FFVideoFormat1080p${fps}`, frameDuration: frameDuration } }
            },
            library: {
                event: {
                    _attributes: { name: 'DragToSync Event' },
                    project: {
                        _attributes: { name: 'Synced Project' },
                        sequence: {
                            _attributes: { format: 'r1' },
                            spine: {
                                gap: {
                                    _attributes: { name: 'Slug', offset: '0s', duration: `${projectDuration}/${fps}s`, start: '0s' },
                                    'chapter-marker': markers // Markers attached to the gap
                                }
                            }
                        }
                    }
                }
            }
        }
    };

    return js2xml(xml, { compact: true, spaces: 4 });
}
