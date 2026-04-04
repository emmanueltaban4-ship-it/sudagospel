import { Music, Star } from "lucide-react";
import { Link } from "react-router-dom";

interface ArtistCardProps {
  id?: string;
  name: string;
  genre: string;
  songs: number;
  avatarUrl?: string | null;
  isVerified?: boolean;
}

const ArtistCard = ({ id, name, genre, songs, avatarUrl, isVerified }: ArtistCardProps) => {
  const content = (
    <div className="flex flex-col items-center gap-2 group cursor-pointer">
      <div className="relative h-24 w-24 md:h-28 md:w-28 rounded-full overflow-hidden ring-2 ring-border group-hover:ring-primary transition-all duration-300">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-muted flex items-center justify-center text-2xl font-heading font-bold text-muted-foreground">
            {name[0]}
          </div>
        )}
        {isVerified && (
          <div className="absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-full bg-primary flex items-center justify-center ring-2 ring-background">
            <Star className="h-3 w-3 text-primary-foreground fill-primary-foreground" />
          </div>
        )}
      </div>
      <div className="text-center">
        <h3 className="font-heading font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{name}</h3>
        <p className="text-[10px] text-muted-foreground">{genre} · {songs} songs</p>
      </div>
    </div>
  );

  if (id) {
    return <Link to={`/artist/${id}`}>{content}</Link>;
  }
  return content;
};

export default ArtistCard;
