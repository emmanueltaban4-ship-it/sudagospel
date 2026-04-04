import { Play, Heart, Download, Share2 } from "lucide-react";

interface SongCardProps {
  title: string;
  artist: string;
  coverUrl: string;
  plays: string;
}

const SongCard = ({ title, artist, coverUrl, plays }: SongCardProps) => {
  return (
    <div className="group flex flex-col rounded-lg bg-card border border-border overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="relative aspect-square overflow-hidden">
        <div className="absolute inset-0 bg-gospel-dark/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button className="rounded-full bg-primary p-3 text-primary-foreground shadow-lg hover:scale-110 transition-transform">
            <Play className="h-6 w-6" fill="currentColor" />
          </button>
        </div>
        <div className="h-full w-full bg-gradient-brand flex items-center justify-center text-3xl font-heading font-bold text-primary-foreground">
          {title[0]}
        </div>
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
            <button className="rounded-full p-1 text-muted-foreground hover:text-secondary transition-colors">
              <Download className="h-3.5 w-3.5" />
            </button>
            <button className="rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors">
              <Share2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongCard;
