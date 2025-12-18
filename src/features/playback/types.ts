export interface PlaybackState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isReady: boolean;
}

export interface PlaybackActions {
  play: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  setVolume?: (vol: number) => void;
  load?: (source: any) => Promise<void>; // source type varies
}

export type PlaybackController = PlaybackState & PlaybackActions;
