import { Music } from "lucide-react";

interface ArtistCardProps {
  name: string;
  genre: string;
  songs: number;
}

const ArtistCard = ({ name, genre, songs }: ArtistCardProps) => {
  return (
    <div className="flex flex-col items-center gap-2 group cursor-pointer">
      <div className="relative h-20 w-20 md:h-24 md:w-24 rounded-full overflow-hidden ring-2 ring-border group-hover:ring-primary transition-all duration-300">
        <div className="h-full w-full bg-gradient-brand flex items-center justify-center text-2xl font-heading font-bold text-primary-foreground">
          {name[0]}
        </div>
      </div>
      <div className="text-center">
        <h3 className="font-heading font-semibold text-sm text-foreground">{name}</h3>
        <p className="text-xs text-muted-foreground">{genre}</p>
        <div className="flex items-center gap-1 justify-center mt-0.5">
          <Music className="h-3 w-3 text-primary" />
          <span className="text-xs text-muted-foreground">{songs} songs</span>
        </div>
      </div>
    </div>
  );
};

export default ArtistCard;
