import { Play, Pause, Heart, Download, Share2, ListPlus } from "lucide-react";
import { usePlayer, Track } from "@/hooks/use-player";
import { toast } from "sonner";
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
    if (isCurrentTrack) {
      togglePlay();
    } else {
      play({ id, title, artist, fileUrl, coverUrl }, queue);
    }
  };

  const cardContent = (
    <div className="group flex flex-col rounded-lg bg-card border border-border overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="relative aspect-square overflow-hidden">
        {fileUrl && (
          <div className="absolute inset-0 bg-gospel-dark/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button
              onClick={handlePlay}
              className="rounded-full bg-primary p-3 text-primary-foreground shadow-lg hover:scale-110 transition-transform"
            >
              {isCurrentTrack && isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" fill="currentColor" />
              )}
            </button>
          </div>
        )}
        {coverUrl ? (
          <img src={coverUrl} alt={title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="h-full w-full bg-gradient-brand flex items-center justify-center text-3xl font-heading font-bold text-primary-foreground">
            {title[0]}
          </div>
        )}
        {isCurrentTrack && (
          <div className="absolute bottom-1 left-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
            {isPlaying ? "Playing" : "Paused"}
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-heading font-semibold text-sm truncate text-card-foreground">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground truncate">{artist}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{plays} plays</span>
          <div className="flex gap-1">
            <button className="rounded-full p-1 text-muted-foreground hover:text-primary transition-colors">
              <Heart className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!fileUrl) return;
                toast.info("Preparing download...");
                fetch(fileUrl)
                  .then(r => r.blob())
                  .then(blob => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${title} - ${artist}.mp3`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    toast.success("Download started!");
                  })
                  .catch(() => toast.error("Download failed."));
              }}
              className="rounded-full p-1 text-muted-foreground hover:text-secondary transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
            {id && (
              <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                <AddToPlaylistDialog songId={id} />
              </span>
            )}
            <button className="rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors">
              <Share2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (id) {
    return <Link to={`/song/${id}`}>{cardContent}</Link>;
  }

  return cardContent;
};

export default SongCard;
