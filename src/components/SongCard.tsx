import { Play, Pause, Heart, Download } from "lucide-react";
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
}

const SongCard = ({ id, title, artist, coverUrl, plays, fileUrl, queue }: SongCardProps) => {
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
      <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-muted shadow-md ring-1 ring-border/50 hover:ring-primary/30 transition-all">
        {fileUrl && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
            <button
              onClick={handlePlay}
              className="rounded-full bg-gradient-gold p-3 text-primary-foreground icon-btn-pop shadow-xl shadow-primary/30"
            >
              {isCurrentTrack && isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
              )}
            </button>
          </div>
        )}
        {coverUrl ? (
          <img src={coverUrl} alt={title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-accent/20 to-primary/10 flex items-center justify-center text-3xl font-heading font-bold text-muted-foreground">
            {title[0]}
          </div>
        )}
        {isCurrentTrack && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground">
            <span className="flex gap-[2px]">
              <span className="w-[2px] h-1.5 bg-primary-foreground rounded-full animate-eq-bar" />
              <span className="w-[2px] h-2.5 bg-primary-foreground rounded-full animate-eq-bar [animation-delay:150ms]" />
              <span className="w-[2px] h-1 bg-primary-foreground rounded-full animate-eq-bar [animation-delay:300ms]" />
            </span>
            {isPlaying ? "Playing" : "Paused"}
          </div>
        )}
      </div>
      <h3 className="font-heading font-semibold text-sm truncate text-foreground group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-xs text-muted-foreground truncate mt-0.5">{artist}</p>
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Play className="h-2.5 w-2.5" /> {plays} plays
        </span>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-1 text-muted-foreground hover:text-primary icon-btn-pop">
            <Heart className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!fileUrl) return;
              downloadFile(fileUrl, `${title} - ${artist}.mp3`);
            }}
            className="p-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <Download className="h-3 w-3" />
          </button>
          {id && (
            <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
              <AddToPlaylistDialog songId={id} />
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (id) return <Link to={`/song/${id}`}>{cardContent}</Link>;
  return cardContent;
};

export default SongCard;
