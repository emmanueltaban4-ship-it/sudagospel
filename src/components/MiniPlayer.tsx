import { Play, Pause, SkipForward, SkipBack, Volume2 } from "lucide-react";
import { usePlayer } from "@/hooks/use-player";
import { useNavigate } from "react-router-dom";

const formatTime = (s: number) => {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const MiniPlayer = () => {
  const { currentTrack, isPlaying, togglePlay, next, prev, currentTime, duration, seek } = usePlayer();
  const navigate = useNavigate();

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-[52px] md:bottom-0 left-0 right-0 z-40 bg-card border-t border-border">
      {/* Progress bar */}
      <div
        className="h-0.5 bg-muted cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = (e.clientX - rect.left) / rect.width;
          seek(pct * duration);
        }}
      >
        <div className="h-full bg-primary transition-all duration-150" style={{ width: `${progress}%` }} />
      </div>

      <div className="container flex items-center gap-3 px-4 py-2">
        <button
          onClick={() => navigate(`/song/${currentTrack.id}`)}
          className="h-10 w-10 rounded flex-shrink-0 overflow-hidden bg-muted"
        >
          {currentTrack.coverUrl ? (
            <img src={currentTrack.coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-sm font-bold text-muted-foreground">
              {currentTrack.title[0]}
            </div>
          )}
        </button>

        <button
          onClick={() => navigate(`/song/${currentTrack.id}`)}
          className="flex-1 min-w-0 text-left"
        >
          <p className="text-sm font-semibold truncate text-foreground">{currentTrack.title}</p>
          <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
        </button>

        <div className="flex items-center gap-0.5">
          <button onClick={prev} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <SkipBack className="h-4 w-4" />
          </button>
          <button onClick={togglePlay} className="rounded-full bg-primary p-2 text-primary-foreground hover:bg-primary/90 transition-colors">
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" fill="currentColor" />}
          </button>
          <button onClick={next} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <SkipForward className="h-4 w-4" />
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 flex-1">
          <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">{formatTime(currentTime)}</span>
          <div
            className="flex-1 h-1 rounded-full bg-muted cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              seek(pct * duration);
            }}
          >
            <div className="h-full rounded-full bg-primary transition-all duration-150" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs text-muted-foreground w-10 tabular-nums">{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default MiniPlayer;
