import { usePlayer } from "@/hooks/use-player";
import { useLikeSong } from "@/hooks/use-engagement";
import { addDownload } from "@/pages/DownloadsPage";
import {
  Play, Pause, SkipForward, SkipBack, Heart, Download, Share2,
  ChevronDown, Music, ListMusic
} from "lucide-react";
import { toast } from "sonner";

interface FullScreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatTime = (s: number) => {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const FullScreenPlayer = ({ isOpen, onClose }: FullScreenPlayerProps) => {
  const {
    currentTrack, isPlaying, togglePlay, next, prev,
    currentTime, duration, seek, queue
  } = usePlayer();

  const { isLiked, toggleLike } = useLikeSong(currentTrack?.id || "");

  if (!currentTrack || !isOpen) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const queueIndex = queue.findIndex(t => t.id === currentTrack.id);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(pct * duration);
  };

  const handleTouchSeek = (e: React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.touches[0].clientX - rect.left) / rect.width));
    seek(pct * duration);
  };

  const handleDownload = () => {
    addDownload({
      id: currentTrack.id,
      title: currentTrack.title,
      artist: currentTrack.artist,
      fileUrl: currentTrack.fileUrl,
      coverUrl: currentTrack.coverUrl,
      downloadedAt: new Date().toISOString(),
    });
    const a = document.createElement("a");
    a.href = currentTrack.fileUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.download = `${currentTrack.title} - ${currentTrack.artist}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Downloaded!");
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/song/${currentTrack.id}`;
    if (navigator.share) {
      await navigator.share({ title: currentTrack.title, text: `Listen to ${currentTrack.title} by ${currentTrack.artist}`, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background">
      {/* Blurred background */}
      <div className="absolute inset-0 overflow-hidden">
        {currentTrack.coverUrl ? (
          <img src={currentTrack.coverUrl} alt="" className="h-full w-full object-cover scale-150 blur-[80px] opacity-30" />
        ) : (
          <div className="h-full w-full bg-gradient-to-b from-primary/20 to-background" />
        )}
        <div className="absolute inset-0 bg-background/70" />
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col px-6 safe-area-bottom">
        {/* Header */}
        <div className="flex items-center justify-between py-4">
          <button onClick={onClose} className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronDown className="h-6 w-6" />
          </button>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Now Playing</p>
            {queue.length > 1 && (
              <p className="text-[10px] text-muted-foreground">{queueIndex + 1} of {queue.length}</p>
            )}
          </div>
          <button className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors">
            <ListMusic className="h-5 w-5" />
          </button>
        </div>

        {/* Cover art */}
        <div className="flex-1 flex items-center justify-center py-4">
          <div className="w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden shadow-2xl">
            {currentTrack.coverUrl ? (
              <img src={currentTrack.coverUrl} alt={currentTrack.title} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Music className="h-20 w-20 text-primary-foreground/60" />
              </div>
            )}
          </div>
        </div>

        {/* Track info */}
        <div className="text-center mb-6">
          <h2 className="font-heading text-xl font-extrabold text-foreground truncate">{currentTrack.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{currentTrack.artist}</p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div
            className="h-1.5 rounded-full bg-muted/60 cursor-pointer group"
            onClick={handleSeek}
            onTouchEnd={handleTouchSeek}
          >
            <div className="h-full rounded-full bg-primary relative transition-[width] duration-100" style={{ width: `${progress}%` }}>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary shadow-lg" />
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[11px] text-muted-foreground tabular-nums">{formatTime(currentTime)}</span>
            <span className="text-[11px] text-muted-foreground tabular-nums">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main controls */}
        <div className="flex items-center justify-center gap-8 mb-6">
          <button onClick={prev} className="p-3 text-foreground active:scale-90 transition-transform">
            <SkipBack className="h-7 w-7" fill="currentColor" />
          </button>
          <button
            onClick={togglePlay}
            className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl active:scale-95 transition-transform"
          >
            {isPlaying ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 ml-1" fill="currentColor" />}
          </button>
          <button onClick={next} className="p-3 text-foreground active:scale-90 transition-transform">
            <SkipForward className="h-7 w-7" fill="currentColor" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-10 pb-8">
          <button onClick={() => toggleLike()} className={`p-2 transition-colors ${isLiked ? "text-primary" : "text-muted-foreground"}`}>
            <Heart className={`h-5 w-5 ${isLiked ? "fill-primary" : ""}`} />
          </button>
          <button onClick={handleDownload} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <Download className="h-5 w-5" />
          </button>
          <button onClick={handleShare} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FullScreenPlayer;
