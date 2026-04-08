import { CheckCircle } from "lucide-react";
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
    <div className="flex flex-col items-center gap-3 group cursor-pointer card-hover rounded-2xl p-3">
      <div className="relative">
        <div className="h-28 w-28 md:h-32 md:w-32 rounded-full overflow-hidden ring-2 ring-border/30 group-hover:ring-primary/50 transition-all duration-500 shadow-xl group-hover:shadow-primary/20">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/15 to-secondary/20 flex items-center justify-center text-2xl font-heading font-bold text-muted-foreground">
              {name[0]}
            </div>
          )}
        </div>
        {isVerified && (
          <div className="absolute -bottom-0.5 -right-0.5 h-7 w-7 rounded-full bg-primary flex items-center justify-center ring-[3px] ring-background shadow-lg shadow-primary/30">
            <CheckCircle className="h-4 w-4 text-primary-foreground" />
          </div>
        )}
      </div>
      <div className="text-center">
        <h3 className="font-heading font-bold text-sm text-foreground group-hover:text-primary transition-colors">{name}</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">{genre} · {songs} songs</p>
      </div>
    </div>
  );

  if (id) return <Link to={artistPath(name)}>{content}</Link>;
  return content;
};

export default ArtistCard;
