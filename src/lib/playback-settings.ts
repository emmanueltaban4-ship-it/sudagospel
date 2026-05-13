// Lightweight persisted playback preferences (data saver, EQ, speed defaults).

const KEY = "sudagospel_playback_settings_v1";

export interface PlaybackSettings {
  dataSaver: boolean;
  playbackRate: number;
  eqEnabled: boolean;
  eqBass: number;   // dB, -12..12
  eqMid: number;    // dB
  eqTreble: number; // dB
}

export const DEFAULT_PLAYBACK_SETTINGS: PlaybackSettings = {
  dataSaver: false,
  playbackRate: 1,
  eqEnabled: false,
  eqBass: 0,
  eqMid: 0,
  eqTreble: 0,
};

export function loadPlaybackSettings(): PlaybackSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_PLAYBACK_SETTINGS };
    return { ...DEFAULT_PLAYBACK_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PLAYBACK_SETTINGS };
  }
}

export function savePlaybackSettings(s: PlaybackSettings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
