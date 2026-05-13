import { createContext, useContext, useState, useRef, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resolvePlayableUrl } from "@/lib/signed-media";
import { offlineDownloads } from "@/lib/offline-downloads";
import { loadPlaybackSettings, savePlaybackSettings, PlaybackSettings } from "@/lib/playback-settings";

// Prefer locally-saved blob if the song was downloaded for offline use.
const resolveTrackUrl = async (id: string, fileUrl: string): Promise<string> => {
  const offline = await offlineDownloads.getBlobUrl(id);
  if (offline) return offline;
  return resolvePlayableUrl(fileUrl);
};

export interface Track {
  id: string;
  title: string;
  artist: string;
  fileUrl: string;
  coverUrl?: string;
}

type RepeatMode = "off" | "all" | "one";

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  queue: Track[];
  recentlyPlayed: Track[];
  shuffle: boolean;
  repeatMode: RepeatMode;
  // New: playback prefs
  playbackRate: number;
  setPlaybackRate: (r: number) => void;
  dataSaver: boolean;
  setDataSaver: (v: boolean) => void;
  eqEnabled: boolean;
  setEqEnabled: (v: boolean) => void;
  eqBass: number;
  eqMid: number;
  eqTreble: number;
  setEqBands: (b: { bass?: number; mid?: number; treble?: number }) => void;
  // New: sleep timer
  sleepTimerEndsAt: number | null;
  setSleepTimer: (minutes: number | null) => void;
  play: (track: Track, queue?: Track[]) => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  next: () => void;
  prev: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
}

const PlayerContext = createContext<PlayerContextType>({
  currentTrack: null,
  isPlaying: false,
  duration: 0,
  currentTime: 0,
  volume: 1,
  queue: [],
  recentlyPlayed: [],
  shuffle: false,
  repeatMode: "off",
  playbackRate: 1,
  setPlaybackRate: () => {},
  dataSaver: false,
  setDataSaver: () => {},
  eqEnabled: false,
  setEqEnabled: () => {},
  eqBass: 0,
  eqMid: 0,
  eqTreble: 0,
  setEqBands: () => {},
  sleepTimerEndsAt: null,
  setSleepTimer: () => {},
  play: () => {},
  togglePlay: () => {},
  seek: () => {},
  setVolume: () => {},
  next: () => {},
  prev: () => {},
  toggleShuffle: () => {},
  cycleRepeat: () => {},
  removeFromQueue: () => {},
  clearQueue: () => {},
});

// Preload next track for gapless playback (best-effort; signed URLs may be skipped if unavailable).
const preloadAudio = async (url: string) => {
  try {
    const resolved = await resolvePlayableUrl(url);
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.as = "fetch";
    link.href = resolved;
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
    setTimeout(() => link.remove(), 60000);
  } catch {
    /* ignore preload failures */
  }
};

export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [queue, setQueue] = useState<Track[]>([]);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>(() => {
    try {
      const stored = localStorage.getItem("sudagospel_recently_played");
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  // Persisted playback prefs (data saver, speed, EQ)
  const initialPrefs = useRef<PlaybackSettings>(loadPlaybackSettings()).current;
  const [playbackRate, setPlaybackRateState] = useState(initialPrefs.playbackRate);
  const [dataSaver, setDataSaverState] = useState(initialPrefs.dataSaver);
  const [eqEnabled, setEqEnabledState] = useState(initialPrefs.eqEnabled);
  const [eqBass, setEqBass] = useState(initialPrefs.eqBass);
  const [eqMid, setEqMid] = useState(initialPrefs.eqMid);
  const [eqTreble, setEqTreble] = useState(initialPrefs.eqTreble);

  // Sleep timer
  const [sleepTimerEndsAt, setSleepTimerEndsAt] = useState<number | null>(null);
  const sleepTimeoutRef = useRef<number | null>(null);

  // Web Audio nodes (created lazily when EQ is first enabled)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const midFilterRef = useRef<BiquadFilterNode | null>(null);
  const trebleFilterRef = useRef<BiquadFilterNode | null>(null);

  // Refs for callbacks that need current state
  const shuffleRef = useRef(shuffle);
  const repeatRef = useRef(repeatMode);
  const queueRef = useRef(queue);
  const currentTrackRef = useRef(currentTrack);
  const dataSaverRef = useRef(dataSaver);
  shuffleRef.current = shuffle;
  repeatRef.current = repeatMode;
  queueRef.current = queue;
  currentTrackRef.current = currentTrack;
  dataSaverRef.current = dataSaver;

  useEffect(() => {
    if (!audioRef.current) {
      const a = new Audio();
      a.crossOrigin = "anonymous"; // needed for Web Audio EQ + safe for Supabase signed URLs
      audioRef.current = a;
      a.addEventListener("timeupdate", () => {
        setCurrentTime(a.currentTime);
      });
      a.addEventListener("loadedmetadata", () => {
        setDuration(a.duration);
      });
      a.addEventListener("ended", () => {
        handleEnded();
      });
    }
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  // Persist playback prefs
  useEffect(() => {
    savePlaybackSettings({
      dataSaver, playbackRate, eqEnabled, eqBass, eqMid, eqTreble,
    });
  }, [dataSaver, playbackRate, eqEnabled, eqBass, eqMid, eqTreble]);

  // Apply playback rate to <audio>
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  // Lazy-init Web Audio + EQ filters
  const ensureEqGraph = useCallback(() => {
    if (!audioRef.current) return false;
    if (sourceNodeRef.current) return true;
    try {
      const Ctx: typeof AudioContext = (window.AudioContext || (window as any).webkitAudioContext);
      if (!Ctx) return false;
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaElementSource(audioRef.current);
      const bass = ctx.createBiquadFilter();
      bass.type = "lowshelf"; bass.frequency.value = 200; bass.gain.value = eqBass;
      const mid = ctx.createBiquadFilter();
      mid.type = "peaking"; mid.frequency.value = 1000; mid.Q.value = 1; mid.gain.value = eqMid;
      const treble = ctx.createBiquadFilter();
      treble.type = "highshelf"; treble.frequency.value = 4000; treble.gain.value = eqTreble;
      src.connect(bass).connect(mid).connect(treble).connect(ctx.destination);
      sourceNodeRef.current = src;
      bassFilterRef.current = bass;
      midFilterRef.current = mid;
      trebleFilterRef.current = treble;
      return true;
    } catch (e) {
      console.warn("[player] EQ init failed", e);
      return false;
    }
  }, [eqBass, eqMid, eqTreble]);

  useEffect(() => {
    if (eqEnabled) ensureEqGraph();
    if (bassFilterRef.current) bassFilterRef.current.gain.value = eqEnabled ? eqBass : 0;
    if (midFilterRef.current) midFilterRef.current.gain.value = eqEnabled ? eqMid : 0;
    if (trebleFilterRef.current) trebleFilterRef.current.gain.value = eqEnabled ? eqTreble : 0;
  }, [eqEnabled, eqBass, eqMid, eqTreble, ensureEqGraph]);

  // Sleep timer
  useEffect(() => {
    if (sleepTimeoutRef.current !== null) {
      window.clearTimeout(sleepTimeoutRef.current);
      sleepTimeoutRef.current = null;
    }
    if (sleepTimerEndsAt !== null) {
      const ms = Math.max(0, sleepTimerEndsAt - Date.now());
      sleepTimeoutRef.current = window.setTimeout(() => {
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
        setSleepTimerEndsAt(null);
      }, ms);
    }
    return () => {
      if (sleepTimeoutRef.current !== null) window.clearTimeout(sleepTimeoutRef.current);
    };
  }, [sleepTimerEndsAt]);

  const playTrack = useCallback((track: Track) => {
    setCurrentTrack(track);
    setRecentlyPlayed(prev => {
      const filtered = prev.filter(t => t.id !== track.id);
      const updated = [track, ...filtered].slice(0, 30);
      localStorage.setItem("sudagospel_recently_played", JSON.stringify(updated));
      return updated;
    });
    if (audioRef.current) {
      const audio = audioRef.current;
      setIsPlaying(true);
      resolveTrackUrl(track.id, track.fileUrl)
        .then((src) => {
          audio.src = src;
          return audio.play();
        })
        .catch(() => setIsPlaying(false));
    }
    // Fire-and-forget play count increment + listening history
    supabase.rpc('increment_play_count', { song_uuid: track.id }).then(() => {});
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from('user_listening_history').insert({ user_id: data.user.id, song_id: track.id }).then(() => {});
      }
    });
    // Preload next track in queue (skipped in data-saver mode)
    if (!dataSaverRef.current) {
      requestIdleCallback(() => {
        const q = queueRef.current;
        const idx = q.findIndex(t => t.id === track.id);
        const next = q[idx + 1];
        if (next) preloadAudio(next.fileUrl);
      });
    }
  }, []);

  const play = useCallback((track: Track, newQueue?: Track[]) => {
    if (newQueue) setQueue(newQueue);
    playTrack(track);
  }, [playTrack]);

  const getNextTrack = useCallback(() => {
    const q = queueRef.current;
    const cur = currentTrackRef.current;
    if (!cur || q.length === 0) return null;
    const idx = q.findIndex(t => t.id === cur.id);
    if (shuffleRef.current) {
      const others = q.filter(t => t.id !== cur.id);
      if (others.length === 0) return q[0];
      return others[Math.floor(Math.random() * others.length)];
    }
    return q[(idx + 1) % q.length];
  }, []);

  const handleEnded = useCallback(() => {
    if (repeatRef.current === "one") {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
      return;
    }
    const q = queueRef.current;
    const cur = currentTrackRef.current;
    if (!cur) return;
    const idx = q.findIndex(t => t.id === cur.id);
    const isLast = idx === q.length - 1;
    if (isLast && repeatRef.current === "off") {
      setIsPlaying(false);
      return;
    }
    const next = getNextTrack();
    if (next) playTrack(next);
  }, [playTrack, getNextTrack]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  }, [isPlaying, currentTrack]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    if (audioRef.current) {
      audioRef.current.volume = vol;
      setVolumeState(vol);
    }
  }, []);

  const handleNext = useCallback(() => {
    const next = getNextTrack();
    if (next) playTrack(next);
  }, [getNextTrack, playTrack]);

  const handlePrev = useCallback(() => {
    if (!currentTrack || queue.length === 0) return;
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    const idx = queue.findIndex(t => t.id === currentTrack.id);
    const prevTrack = queue[(idx - 1 + queue.length) % queue.length];
    if (prevTrack) playTrack(prevTrack);
  }, [currentTrack, queue, playTrack]);

  const toggleShuffle = useCallback(() => setShuffle(s => !s), []);
  const cycleRepeat = useCallback(() => {
    setRepeatMode(m => m === "off" ? "all" : m === "all" ? "one" : "off");
  }, []);
  const removeFromQueue = useCallback((id: string) => {
    setQueue(q => q.filter(t => t.id !== id));
  }, []);
  const clearQueue = useCallback(() => setQueue([]), []);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack, isPlaying, duration, currentTime, volume,
        queue, recentlyPlayed, shuffle, repeatMode,
        play, togglePlay, seek, setVolume,
        next: handleNext, prev: handlePrev,
        toggleShuffle, cycleRepeat, removeFromQueue, clearQueue,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};
