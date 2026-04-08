import { Play, Pause, Heart, Download, CheckCircle } from "lucide-react";
import { usePlayer, Track } from "@/hooks/use-player";
import { toast } from "sonner";
import { downloadFile } from "@/lib/download";
import { Link } from "react-router-dom";
import AddToPlaylistDialog from "@/components/AddToPlaylistDialog";

interface SongCardProps {
  id?: string;
  title: string;
  artist: string;
  coverUrl: string;
  plays: string;
  fileUrl?: string;
  queue?: Track[];
  isVerifiedArtist?: boolean;
}

const SongCard = ({ id, title, artist, coverUrl, plays, fileUrl, queue, isVerifiedArtist }: SongCardProps) => {
  const { play, currentTrack, isPlaying, togglePlay } = usePlayer();
  const isCurrentTrack = currentTrack?.id === id;

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!id || !fileUrl) return;
    if (isCurrentTrack) togglePlay();
    else play({ id, title, artist, fileUrl, coverUrl }, queue);
  };

  const cardContent = (
    <div className="group flex flex-col card-hover rounded-xl">
      {/* Cover art */}
      <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 bg-muted shadow-lg ring-1 ring-border/40 group-hover:ring-primary/30 group-hover:shadow-primary/10 transition-all duration-300">
        {fileUrl && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end justify-between p-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
            <div className="flex gap-1">
              <button className="p-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/80 hover:text-white hover:bg-white/20 transition-all icon-btn-pop">
                <Heart className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!fileUrl) return;
                  downloadFile(fileUrl, `${title} - ${artist}.mp3`);
                }}
                className="p-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/80 hover:text-white hover:bg-white/20 transition-all icon-btn-pop"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
              {id && (
                <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                  <AddToPlaylistDialog songId={id} />
                </span>
              )}
            </div>
            <button
              onClick={handlePlay}
              className="rounded-full bg-primary p-3 text-primary-foreground shadow-xl shadow-primary/40 hover:scale-110 active:scale-95 transition-all"
            >
              {isCurrentTrack && isPlaying ? (
                <Pause className="h-4.5 w-4.5" />
              ) : (
                <Play className="h-4.5 w-4.5 ml-0.5" fill="currentColor" />
              )}
            </button>
          </div>
        )}
        {coverUrl ? (
          <img src={coverUrl} alt={title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-accent/20 to-primary/10 flex items-center justify-center text-3xl font-heading font-bold text-muted-foreground">
            {title[0]}
          </div>
        )}
        {isCurrentTrack && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-primary/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold text-primary-foreground z-20 shadow-lg">
            <span className="flex gap-[2px]">
              <span className="w-[2px] h-1.5 bg-primary-foreground rounded-full animate-eq-bar" />
              <span className="w-[2px] h-2.5 bg-primary-foreground rounded-full animate-eq-bar [animation-delay:150ms]" />
              <span className="w-[2px] h-1 bg-primary-foreground rounded-full animate-eq-bar [animation-delay:300ms]" />
            </span>
            {isPlaying ? "Playing" : "Paused"}
          </div>
        )}
      </div>

      {/* Info */}
      <h3 className="font-heading font-semibold text-sm truncate text-foreground group-hover:text-primary transition-colors leading-snug">
        {title}
      </h3>
      <p className="text-xs text-muted-foreground truncate mt-0.5">{artist}</p>
      <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1 mt-1">
        <Play className="h-2.5 w-2.5" /> {plays}
      </span>
    </div>
  );

  if (id) return <Link to={`/song/${id}`}>{cardContent}</Link>;
  return cardContent;
};

export default SongCard;
