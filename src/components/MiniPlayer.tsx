import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Maximize2 } from "lucide-react";
import { usePlayer } from "@/hooks/use-player";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const formatTime = (s: number) => {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const MiniPlayer = () => {
  const { currentTrack, isPlaying, togglePlay, next, prev, currentTime, duration, seek, volume, setVolume } = usePlayer();
  const navigate = useNavigate();
  const [showVol, setShowVol] = useState(false);

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-[52px] md:bottom-0 left-0 right-0 z-40 glass border-t border-border">
      {/* Thin progress bar on top */}
      <div
        className="h-[3px] bg-muted cursor-pointer group relative"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = (e.clientX - rect.left) / rect.width;
          seek(pct * duration);
        }}
      >
        <div
          className="h-full bg-primary transition-all duration-150 relative"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <div className="flex items-center gap-3 px-4 py-2 max-w-screen-2xl mx-auto">
        {/* Track info */}
        <button
          onClick={() => navigate(`/song/${currentTrack.id}`)}
          className="flex items-center gap-3 flex-1 min-w-0"
        >
          <div className="h-11 w-11 rounded-md flex-shrink-0 overflow-hidden bg-muted shadow-lg">
            {currentTrack.coverUrl ? (
              <img src={currentTrack.coverUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-sm font-bold text-muted-foreground bg-muted">
                {currentTrack.title[0]}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate text-foreground">{currentTrack.title}</p>
            <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
          </div>
        </button>

        {/* Center controls */}
        <div className="flex items-center gap-1">
          <button onClick={prev} className="p-2 text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            <SkipBack className="h-4 w-4" />
          </button>
          <button
            onClick={togglePlay}
            className="rounded-full bg-foreground p-2.5 text-background hover:scale-105 transition-transform"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" fill="currentColor" />}
          </button>
          <button onClick={next} className="p-2 text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            <SkipForward className="h-4 w-4" />
          </button>
        </div>

        {/* Right side — desktop */}
        <div className="hidden md:flex items-center gap-3 flex-1 justify-end">
          <span className="text-[11px] text-muted-foreground tabular-nums w-10 text-right">{formatTime(currentTime)}</span>
          <div
            className="flex-1 max-w-[200px] h-1 rounded-full bg-muted cursor-pointer group"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              seek(pct * duration);
            }}
          >
            <div className="h-full rounded-full bg-foreground/60 group-hover:bg-primary transition-colors" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-[11px] text-muted-foreground tabular-nums w-10">{formatTime(duration)}</span>

          {/* Volume */}
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={() => setVolume(volume > 0 ? 0 : 1)}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20 h-1 accent-primary cursor-pointer"
            />
          </div>

          <button
            onClick={() => navigate(`/song/${currentTrack.id}`)}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MiniPlayer;
