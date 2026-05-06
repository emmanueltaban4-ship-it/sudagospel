import {
  Play, Pause, SkipForward, SkipBack, Volume, Volume1, Volume2, VolumeX,
  Repeat, Shuffle, Heart, ListMusic, Maximize2, Music, ChevronUp
} from "lucide-react";
import { usePlayer } from "@/hooks/use-player";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useCallback } from "react";
import FullScreenPlayer from "@/components/FullScreenPlayer";

const formatTime = (s: number) => {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const MiniPlayer = () => {
  const {
    currentTrack, isPlaying, togglePlay, next, prev,
    currentTime, duration, seek, volume, setVolume, queue,
    shuffle, repeatMode, toggleShuffle, cycleRepeat
  } = usePlayer();
  const navigate = useNavigate();
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [prevVolume, setPrevVolume] = useState(1);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const displayProgress = isDraggingProgress ? dragProgress : progress;
  const queueIndex = queue.findIndex((t) => t.id === currentTrack.id);

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.33 ? Volume : volume < 0.66 ? Volume1 : Volume2;

  const handleProgressInteraction = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0]?.clientX ?? (e as TouchEvent).changedTouches[0]?.clientX : (e as MouseEvent).clientX;
    if (clientX === undefined) return;
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  };

  const handleVolumeInteraction = (e: React.MouseEvent | MouseEvent) => {
    if (!volumeRef.current) return;
    const rect = volumeRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  };

  const toggleMute = () => {
    if (volume > 0) { setPrevVolume(volume); setVolume(0); }
    else setVolume(prevVolume || 1);
  };

  // Touch-friendly progress seeking for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDraggingProgress(true);
    const pct = handleProgressInteraction(e);
    if (pct !== undefined) setDragProgress(pct * 100);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const pct = handleProgressInteraction(e);
    if (pct !== undefined) setDragProgress(pct * 100);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const pct = handleProgressInteraction(e);
    if (pct !== undefined) seek(pct * duration);
    setIsDraggingProgress(false);
  };

  return (
    <>
      <FullScreenPlayer isOpen={showFullScreen} onClose={() => setShowFullScreen(false)} />

      <div className="fixed bottom-[56px] md:bottom-0 left-0 right-0 z-40">
        <div className="absolute inset-0 glass-strong border-t border-border/50" />

        <div className="relative">
          {/* === MOBILE LAYOUT === */}
          <div className="md:hidden">
            {/* Progress bar — taller touch target */}
            <div
              ref={progressRef}
              className="h-[6px] bg-muted/40 cursor-pointer relative group touch-none"
              onClick={(e) => {
                const pct = handleProgressInteraction(e);
                if (pct !== undefined) seek(pct * duration);
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="h-full bg-gradient-gold transition-[width] duration-100" style={{ width: `${displayProgress}%` }}>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary shadow-lg shadow-primary/50 opacity-100 transition-opacity" />
              </div>
            </div>

            <div className="flex items-center gap-3 px-3 py-2.5">
              {/* Cover art — tap to expand */}
              <button
                onClick={() => setShowFullScreen(true)}
                className="flex-shrink-0 active:scale-95 transition-transform"
              >
                <div className="h-12 w-12 rounded-xl overflow-hidden bg-muted shadow-md ring-1 ring-primary/10">
                  {currentTrack.coverUrl ? (
                    <img src={currentTrack.coverUrl} alt="" className="h-full w-full object-cover" / loading="lazy" decoding="async">
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-accent/30 to-primary/20">
                      <Music className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </button>

              {/* Song info — tap to expand */}
              <button onClick={() => setShowFullScreen(true)} className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold truncate text-foreground leading-tight">{currentTrack.title}</p>
                <p className="text-[11px] text-muted-foreground truncate">{currentTrack.artist}</p>
              </button>

              {/* Controls — large touch targets */}
              <div className="flex items-center gap-0">
                <button
                  onClick={prev}
                  className="h-11 w-10 flex items-center justify-center text-muted-foreground active:text-foreground active:scale-90 transition-all"
                >
                  <SkipBack className="h-[18px] w-[18px]" />
                </button>
                <button
                  onClick={togglePlay}
                  className="h-12 w-12 rounded-full bg-gradient-gold text-primary-foreground flex items-center justify-center active:scale-90 transition-transform shadow-lg shadow-primary/30"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" fill="currentColor" />}
                </button>
                <button
                  onClick={next}
                  className="h-11 w-10 flex items-center justify-center text-muted-foreground active:text-foreground active:scale-90 transition-all"
                >
                  <SkipForward className="h-[18px] w-[18px]" />
                </button>
              </div>
            </div>
          </div>

          {/* === DESKTOP LAYOUT === */}
          <div className="hidden md:block">
            <div className="flex items-center gap-4 px-4 py-2.5 max-w-screen-2xl mx-auto h-[72px]">
              <div className="flex items-center gap-3 w-[280px] flex-shrink-0">
                <button onClick={() => setShowFullScreen(true)} className="flex-shrink-0 group">
                  <div className="h-14 w-14 rounded-lg overflow-hidden bg-muted shadow-lg group-hover:shadow-xl group-hover:glow-gold transition-all ring-1 ring-primary/10">
                    {currentTrack.coverUrl ? (
                      <img src={currentTrack.coverUrl} alt="" className="h-full w-full object-cover" / loading="lazy" decoding="async">
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-accent/30 to-primary/20">
                        <Music className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </button>
                <button onClick={() => navigate(`/song/${currentTrack.id}`)} className="min-w-0 text-left">
                  <p className="text-sm font-semibold truncate text-foreground hover:text-primary transition-colors leading-tight">{currentTrack.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate hover:text-foreground transition-colors">{currentTrack.artist}</p>
                </button>
                <button className="p-1.5 text-muted-foreground hover:text-primary transition-colors flex-shrink-0">
                  <Heart className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 flex flex-col items-center gap-1.5 max-w-[600px] mx-auto">
                <div className="flex items-center gap-3">
                  <button onClick={toggleShuffle} className={`p-1.5 transition-colors ${shuffle ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                    <Shuffle className="h-4 w-4" />
                  </button>
                  <button onClick={prev} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                    <SkipBack className="h-4.5 w-4.5" fill="currentColor" />
                  </button>
                  <button
                    onClick={togglePlay}
                    className="h-9 w-9 rounded-full bg-gradient-gold text-primary-foreground flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-md shadow-primary/30"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" fill="currentColor" />}
                  </button>
                  <button onClick={next} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                    <SkipForward className="h-4.5 w-4.5" fill="currentColor" />
                  </button>
                  <button onClick={cycleRepeat} className={`p-1.5 transition-colors ${repeatMode !== "off" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                    <Repeat className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full">
                  <span className="text-[10px] text-muted-foreground tabular-nums w-10 text-right select-none">
                    {formatTime(isDraggingProgress ? (dragProgress / 100) * duration : currentTime)}
                  </span>
                  <div
                    ref={progressRef}
                    className="flex-1 h-1 rounded-full bg-muted/60 cursor-pointer group relative hover:h-1.5 transition-all"
                    onMouseDown={(e) => {
                      setIsDraggingProgress(true);
                      const pct = handleProgressInteraction(e);
                      if (pct !== undefined) setDragProgress(pct * 100);
                      const onMove = (ev: MouseEvent) => {
                        const p = handleProgressInteraction(ev);
                        if (p !== undefined) setDragProgress(p * 100);
                      };
                      const onUp = (ev: MouseEvent) => {
                        const p = handleProgressInteraction(ev);
                        if (p !== undefined) seek(p * duration);
                        setIsDraggingProgress(false);
                        window.removeEventListener("mousemove", onMove);
                        window.removeEventListener("mouseup", onUp);
                      };
                      window.addEventListener("mousemove", onMove);
                      window.addEventListener("mouseup", onUp);
                    }}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-gold group-hover:opacity-100 transition-all relative"
                      style={{ width: `${displayProgress}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity shadow-md shadow-primary/50" />
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground tabular-nums w-10 select-none">
                    {formatTime(duration)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-[280px] flex-shrink-0 justify-end">
                <button
                  onClick={() => setShowFullScreen(true)}
                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
                {queue.length > 0 && (
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {queueIndex + 1}/{queue.length}
                  </span>
                )}
                <div className="flex items-center gap-1.5 group/vol">
                  <button onClick={toggleMute} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                    <VolumeIcon className="h-4 w-4" />
                  </button>
                  <div
                    ref={volumeRef}
                    className="w-24 h-1 rounded-full bg-muted/60 cursor-pointer relative group/bar hover:h-1.5 transition-all"
                    onMouseDown={(e) => {
                      const v = handleVolumeInteraction(e);
                      if (v !== undefined) setVolume(v);
                      setIsDraggingVolume(true);
                      const onMove = (ev: MouseEvent) => {
                        const vol = handleVolumeInteraction(ev);
                        if (vol !== undefined) setVolume(vol);
                      };
                      const onUp = () => {
                        setIsDraggingVolume(false);
                        window.removeEventListener("mousemove", onMove);
                        window.removeEventListener("mouseup", onUp);
                      };
                      window.addEventListener("mousemove", onMove);
                      window.addEventListener("mouseup", onUp);
                    }}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-gold group-hover/bar:opacity-100 transition-all relative"
                      style={{ width: `${volume * 100}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary opacity-0 group-hover/bar:opacity-100 transition-opacity shadow-md" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MiniPlayer;
