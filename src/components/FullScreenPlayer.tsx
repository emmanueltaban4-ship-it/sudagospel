import { usePlayer, Track } from "@/hooks/use-player";
import { useLikeSong } from "@/hooks/use-engagement";
import { addDownload } from "@/pages/DownloadsPage";
import {
  Play, Pause, SkipForward, SkipBack, Heart, Download, Share2,
  ChevronDown, Music, ListMusic, Shuffle, Repeat, Repeat1,
  Volume, Volume1, Volume2, VolumeX, X, Trash2
} from "lucide-react";
import { toast } from "sonner";
import { downloadFile } from "@/lib/download";
import ShareDialog from "@/components/ShareDialog";
import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

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
    currentTime, duration, seek, queue, volume, setVolume,
    shuffle, repeatMode, toggleShuffle, cycleRepeat,
    play, removeFromQueue
  } = usePlayer();

  const { isLiked, toggleLike } = useLikeSong(currentTrack?.id || "");
  const [showQueue, setShowQueue] = useState(false);
  const [prevVolume, setPrevVolume] = useState(1);
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const queueIndex = queue.findIndex(t => t.id === currentTrack.id);

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.33 ? Volume : volume < 0.66 ? Volume1 : Volume2;
  const RepeatIcon = repeatMode === "one" ? Repeat1 : Repeat;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0]?.clientX ?? (e as any).changedTouches?.[0]?.clientX : (e as React.MouseEvent).clientX;
    if (clientX === undefined) return;
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    seek(pct * duration);
  };

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const v = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setVolume(v);
  };

  const toggleMute = () => {
    if (volume > 0) { setPrevVolume(volume); setVolume(0); }
    else setVolume(prevVolume || 1);
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
    downloadFile(currentTrack.fileUrl, `${currentTrack.title} - ${currentTrack.artist}.mp3`);
  };

  const shareUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/og-share?type=song&id=${currentTrack.id}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed inset-0 z-[60] flex flex-col bg-background"
        >
          {/* Blurred background */}
          <div className="absolute inset-0 overflow-hidden">
            {currentTrack.coverUrl ? (
              <motion.img
                key={currentTrack.id}
                initial={{ opacity: 0, scale: 1.6 }}
                animate={{ opacity: 0.25, scale: 1.5 }}
                transition={{ duration: 0.8 }}
                src={currentTrack.coverUrl}
                alt=""
                className="h-full w-full object-cover blur-[80px]"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-b from-secondary/20 via-background to-background" />
            )}
            <div className="absolute inset-0 bg-background/70" />
          </div>

          {/* Content */}
          <div className="relative flex-1 flex flex-col safe-area-bottom overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0">
              <button onClick={onClose} className="p-2 -ml-2 text-muted-foreground hover:text-foreground active:scale-90 transition-all">
                <ChevronDown className="h-6 w-6" />
              </button>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">Now Playing</p>
                {queue.length > 1 && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">{queueIndex + 1} of {queue.length}</p>
                )}
              </div>
              <button
                onClick={() => setShowQueue(!showQueue)}
                className={`p-2 -mr-2 transition-colors active:scale-90 ${showQueue ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                <ListMusic className="h-5 w-5" />
              </button>
            </div>

            {/* Main content area */}
            <AnimatePresence mode="wait">
              {showQueue ? (
                /* === QUEUE VIEW === */
                <motion.div
                  key="queue"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col px-5 overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading text-lg font-bold text-foreground">Queue</h3>
                    <span className="text-xs text-muted-foreground">{queue.length} songs</span>
                  </div>
                  <div className="flex-1 overflow-y-auto scrollbar-hide space-y-0.5 pb-4">
                    {queue.map((track, i) => {
                      const isCurrent = track.id === currentTrack.id;
                      return (
                        <motion.div
                          key={track.id}
                          layout
                          className={`flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer group ${
                            isCurrent ? "bg-primary/10 border border-primary/20" : "hover:bg-card/60"
                          }`}
                          onClick={() => play(track)}
                        >
                          <span className={`text-xs font-bold tabular-nums w-6 text-center ${
                            isCurrent ? "text-primary" : "text-muted-foreground/40"
                          }`}>
                            {isCurrent ? (
                              <span className="flex items-center justify-center gap-[2px]">
                                <span className="w-[2px] h-2 bg-primary rounded-full animate-pulse" />
                                <span className="w-[2px] h-3 bg-primary rounded-full animate-pulse [animation-delay:150ms]" />
                                <span className="w-[2px] h-1.5 bg-primary rounded-full animate-pulse [animation-delay:300ms]" />
                              </span>
                            ) : i + 1}
                          </span>
                          <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {track.coverUrl ? (
                              <img src={track.coverUrl} alt="" className="h-full w-full object-cover" / loading="lazy" decoding="async">
                            ) : (
                              <div className="h-full w-full bg-gradient-to-br from-secondary/20 to-primary/10 flex items-center justify-center">
                                <Music className="h-4 w-4 text-muted-foreground/40" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold truncate ${isCurrent ? "text-primary" : "text-foreground"}`}>
                              {track.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">{track.artist}</p>
                          </div>
                          {!isCurrent && (
                            <button
                              onClick={(e) => { e.stopPropagation(); removeFromQueue(track.id); }}
                              className="p-1.5 text-muted-foreground/30 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </motion.div>
                      );
                    })}
                    {queue.length === 0 && (
                      <div className="text-center py-16">
                        <ListMusic className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">Queue is empty</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                /* === PLAYER VIEW === */
                <motion.div
                  key="player"
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col px-6"
                >
                  {/* Cover art */}
                  <div className="flex-1 flex items-center justify-center py-4">
                    <motion.div
                      key={currentTrack.id}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", damping: 20, stiffness: 200 }}
                      className="w-full max-w-[320px] aspect-square rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/5"
                    >
                      {currentTrack.coverUrl ? (
                        <img src={currentTrack.coverUrl} alt={currentTrack.title} className="h-full w-full object-cover" / loading="lazy" decoding="async">
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-secondary/30 to-primary/20 flex items-center justify-center">
                          <Music className="h-20 w-20 text-muted-foreground/30" />
                        </div>
                      )}
                    </motion.div>
                  </div>

                  {/* Track info + like */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="min-w-0 flex-1">
                      <motion.h2
                        key={currentTrack.title}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="font-heading text-xl font-extrabold text-foreground truncate"
                      >
                        {currentTrack.title}
                      </motion.h2>
                      <motion.p
                        key={currentTrack.artist}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="text-sm text-muted-foreground mt-0.5"
                      >
                        {currentTrack.artist}
                      </motion.p>
                    </div>
                    <button
                      onClick={() => toggleLike()}
                      className={`p-2.5 rounded-full transition-all active:scale-90 ${
                        isLiked ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Heart className={`h-5 w-5 ${isLiked ? "fill-primary" : ""}`} />
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-5">
                    <div
                      ref={progressRef}
                      className="h-1.5 rounded-full bg-muted/40 cursor-pointer group hover:h-2 transition-all"
                      onClick={handleSeek}
                      onTouchMove={handleSeek}
                    >
                      <div
                        className="h-full rounded-full bg-gradient-gold relative transition-[width] duration-100"
                        style={{ width: `${progress}%` }}
                      >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary shadow-lg shadow-primary/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-[11px] text-muted-foreground tabular-nums">{formatTime(currentTime)}</span>
                      <span className="text-[11px] text-muted-foreground tabular-nums">{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Main controls */}
                  <div className="flex items-center justify-between mb-5 px-2">
                    <button
                      onClick={toggleShuffle}
                      className={`p-2 rounded-full transition-all active:scale-90 ${
                        shuffle ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Shuffle className="h-5 w-5" />
                    </button>
                    <button onClick={prev} className="p-3 text-foreground active:scale-90 transition-transform">
                      <SkipBack className="h-7 w-7" fill="currentColor" />
                    </button>
                    <button
                      onClick={togglePlay}
                      className="h-16 w-16 rounded-full bg-gradient-gold text-primary-foreground flex items-center justify-center shadow-xl shadow-primary/40 active:scale-95 hover:scale-105 transition-transform"
                    >
                      {isPlaying ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 ml-1" fill="currentColor" />}
                    </button>
                    <button onClick={next} className="p-3 text-foreground active:scale-90 transition-transform">
                      <SkipForward className="h-7 w-7" fill="currentColor" />
                    </button>
                    <button
                      onClick={cycleRepeat}
                      className={`p-2 rounded-full transition-all active:scale-90 ${
                        repeatMode !== "off" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <RepeatIcon className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Volume control */}
                  <div className="flex items-center gap-3 mb-4 px-2">
                    <button onClick={toggleMute} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                      <VolumeIcon className="h-4 w-4" />
                    </button>
                    <div
                      ref={volumeRef}
                      className="flex-1 h-1 rounded-full bg-muted/40 cursor-pointer group hover:h-1.5 transition-all"
                      onClick={handleVolumeClick}
                    >
                      <div
                        className="h-full rounded-full bg-gradient-gold relative transition-[width]"
                        style={{ width: `${volume * 100}%` }}
                      >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity shadow-md" />
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-center gap-10 pb-6">
                    <button onClick={handleDownload} className="p-2 text-muted-foreground hover:text-foreground active:scale-90 transition-all">
                      <Download className="h-5 w-5" />
                    </button>
                    <ShareDialog
                      title={currentTrack.title}
                      artist={currentTrack.artist}
                      coverUrl={currentTrack.coverUrl}
                      shareUrl={shareUrl}
                      type="song"
                      trigger={
                        <button className="p-2 text-muted-foreground hover:text-foreground active:scale-90 transition-all">
                          <Share2 className="h-5 w-5" />
                        </button>
                      }
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FullScreenPlayer;
