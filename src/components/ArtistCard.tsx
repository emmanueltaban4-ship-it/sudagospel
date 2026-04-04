import { Music } from "lucide-react";
import { Link } from "react-router-dom";

interface ArtistCardProps {
  id?: string;
  name: string;
  genre: string;
  songs: number;
  avatarUrl?: string | null;
}

const ArtistCard = ({ id, name, genre, songs, avatarUrl }: ArtistCardProps) => {
  const content = (
    <div className="flex flex-col items-center gap-2 group cursor-pointer">
      <div className="relative h-20 w-20 md:h-24 md:w-24 rounded-full overflow-hidden ring-2 ring-border group-hover:ring-primary transition-all duration-300">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-gradient-brand flex items-center justify-center text-2xl font-heading font-bold text-primary-foreground">
            {name[0]}
          </div>
        )}
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
