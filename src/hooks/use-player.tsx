import { createContext, useContext, useState, useRef, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const getPlayableUrl = (url: string) =>
  url.includes("sudagospel.com/get-track.php") || url.includes("sudagospel.net/get-track.php")
    ? `${SUPABASE_URL}/functions/v1/download-proxy?url=${encodeURIComponent(url)}`
    : url;

// Preload next track for gapless playback
const preloadAudio = (url: string) => {
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.as = "fetch";
  link.href = getPlayableUrl(url);
  link.crossOrigin = "anonymous";
  document.head.appendChild(link);
  setTimeout(() => link.remove(), 60000);
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

  // Refs for callbacks that need current state
  const shuffleRef = useRef(shuffle);
  const repeatRef = useRef(repeatMode);
  const queueRef = useRef(queue);
  const currentTrackRef = useRef(currentTrack);
  shuffleRef.current = shuffle;
  repeatRef.current = repeatMode;
  queueRef.current = queue;
  currentTrackRef.current = currentTrack;

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener("timeupdate", () => {
        setCurrentTime(audioRef.current!.currentTime);
      });
      audioRef.current.addEventListener("loadedmetadata", () => {
        setDuration(audioRef.current!.duration);
      });
      audioRef.current.addEventListener("ended", () => {
        handleEnded();
      });
    }
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const playTrack = useCallback((track: Track) => {
    setCurrentTrack(track);
    setRecentlyPlayed(prev => {
      const filtered = prev.filter(t => t.id !== track.id);
      const updated = [track, ...filtered].slice(0, 30);
      localStorage.setItem("sudagospel_recently_played", JSON.stringify(updated));
      return updated;
    });
    if (audioRef.current) {
      audioRef.current.src = getPlayableUrl(track.fileUrl);
      audioRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
    // Fire-and-forget play count increment + listening history
    supabase.rpc('increment_play_count', { song_uuid: track.id }).then(() => {});
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from('user_listening_history').insert({ user_id: data.user.id, song_id: track.id }).then(() => {});
      }
    });
    // Preload next track in queue
    requestIdleCallback(() => {
      const q = queueRef.current;
      const idx = q.findIndex(t => t.id === track.id);
      const next = q[idx + 1];
      if (next) preloadAudio(next.fileUrl);
    });
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
