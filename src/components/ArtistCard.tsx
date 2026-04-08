import { Music, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { artistPath } from "@/lib/artist-slug";

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
    <div className="flex flex-col items-center gap-2.5 group cursor-pointer card-hover rounded-2xl p-2">
      <div className="relative h-28 w-28 md:h-32 md:w-32 rounded-full overflow-hidden ring-2 ring-transparent group-hover:ring-primary/50 transition-all duration-300 shadow-lg group-hover:shadow-primary/20">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-muted flex items-center justify-center text-2xl font-heading font-bold text-muted-foreground">
            {name[0]}
          </div>
        )}
        {isVerified && (
          <div className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary flex items-center justify-center ring-3 ring-background shadow-md">
            <CheckCircle className="h-4 w-4 text-primary-foreground" />
          </div>
        )}
      </div>
      <div className="text-center">
        <h3 className="font-heading font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{name}</h3>
        <p className="text-[11px] text-muted-foreground">{genre} · {songs} songs</p>
      </div>
    </div>
  );

  if (id) return <Link to={artistPath(name)}>{content}</Link>;
  return content;
};

export default ArtistCard;
