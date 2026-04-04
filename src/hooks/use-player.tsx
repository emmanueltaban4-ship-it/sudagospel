import { createContext, useContext, useState, useRef, useEffect, useCallback, ReactNode } from "react";

export interface Track {
  id: string;
  title: string;
  artist: string;
  fileUrl: string;
  coverUrl?: string;
}

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  queue: Track[];
  play: (track: Track, queue?: Track[]) => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  next: () => void;
  prev: () => void;
}

const PlayerContext = createContext<PlayerContextType>({
  currentTrack: null,
  isPlaying: false,
  duration: 0,
  currentTime: 0,
  volume: 1,
  queue: [],
  play: () => {},
  togglePlay: () => {},
  seek: () => {},
  setVolume: () => {},
  next: () => {},
  prev: () => {},
});

export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [queue, setQueue] = useState<Track[]>([]);

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
        handleNext();
      });
    }
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const play = useCallback((track: Track, newQueue?: Track[]) => {
    if (newQueue) setQueue(newQueue);
    setCurrentTrack(track);
    if (audioRef.current) {
      audioRef.current.src = track.fileUrl;
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
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
    if (!currentTrack || queue.length === 0) return;
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    const nextTrack = queue[(idx + 1) % queue.length];
    if (nextTrack) play(nextTrack);
  }, [currentTrack, queue, play]);

  const handlePrev = useCallback(() => {
    if (!currentTrack || queue.length === 0) return;
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    const prevTrack = queue[(idx - 1 + queue.length) % queue.length];
    if (prevTrack) play(prevTrack);
  }, [currentTrack, queue, play]);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        duration,
        currentTime,
        volume,
        queue,
        play,
        togglePlay,
        seek,
        setVolume,
        next: handleNext,
        prev: handlePrev,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};
