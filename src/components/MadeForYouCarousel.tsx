import { Link } from "react-router-dom";
import { Play, Pause, Sparkles, ChevronRight } from "lucide-react";
import { artistPath } from "@/lib/artist-slug";
import { usePlayer, Track } from "@/hooks/use-player";

interface MadeForYouSong {
  id: string;
  title: string;
  file_url: string;
  cover_url?: string | null;
  genre?: string | null;
  artists?: { name?: string } | null;
}

interface Props {
  songs: MadeForYouSong[];
  title?: string;
  subtitle?: string;
  linkTo?: string;
}

const MadeForYouCarousel = ({
  songs,
  title = "Made for You",
  subtitle = "Picks based on what you love",
  linkTo = "/for-you",
}: Props) => {
  const { play, currentTrack, isPlaying, togglePlay } = usePlayer();

  if (!songs || songs.length === 0) return null;

  const handlePlay = (song: MadeForYouSong) => {
    const artistName = song.artists?.name || "Unknown";
    const track: Track = {
      id: song.id,
      title: song.title,
      artist: artistName,
      fileUrl: song.file_url,
      coverUrl: song.cover_url || undefined,
    };
    if (currentTrack?.id === song.id) togglePlay();
    else play(track);
  };

  return (
    <section className="py-6">
      <div className="flex items-end justify-between mb-4 px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20 grid place-items-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-heading text-lg md:text-2xl font-black text-foreground tracking-tight leading-none">
              {title}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>
        </div>
        <Link
          to={linkTo}
          className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
        >
          Show all <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="px-4 lg:px-6 overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 pb-2 snap-x snap-mandatory">
          {songs.slice(0, 12).map((song, idx) => {
            const artistName = song.artists?.name || "Unknown";
            const isCurrent = currentTrack?.id === song.id;
            const playing = isCurrent && isPlaying;

            return (
              <div
                key={song.id}
                className="flex-shrink-0 snap-start w-[260px] sm:w-[300px] md:w-[340px] group/mfy"
              >
                <div className="relative h-[180px] sm:h-[200px] md:h-[220px] rounded-2xl overflow-hidden shadow-xl border border-border/40 bg-card">
                  {/* Cover */}
                  {song.cover_url ? (
                    <img
                      src={song.cover_url}
                      alt={song.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/mfy:scale-110"
                      loading={idx < 3 ? "eager" : "lazy"}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-secondary/20 to-card" />
                  )}

                  {/* Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                  {/* Rank badge */}
                  <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded-full px-2.5 py-1 border border-white/10">
                    <Sparkles className="h-3 w-3 text-primary" />
                    For you
                  </div>

                  {/* Bottom info */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-heading font-black text-white text-lg leading-tight truncate drop-shadow">
                        {song.title}
                      </h3>
                      <Link
                        to={artistPath(artistName)}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-white/75 hover:text-primary transition-colors truncate block"
                      >
                        {artistName}
                        {song.genre ? ` · ${song.genre}` : ""}
                      </Link>
                    </div>
                    <button
                      onClick={() => handlePlay(song)}
                      aria-label={playing ? "Pause" : "Play"}
                      className="flex-shrink-0 h-12 w-12 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-2xl shadow-primary/40 hover:scale-110 active:scale-95 transition-transform"
                    >
                      {playing ? (
                        <Pause className="h-5 w-5" fill="currentColor" />
                      ) : (
                        <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
                      )}
                    </button>
                  </div>

                  {playing && (
                    <div className="absolute top-3 right-3 inline-flex items-end gap-[2px] h-4">
                      <span className="w-[3px] bg-primary rounded-full animate-eq-bar h-2" />
                      <span className="w-[3px] bg-primary rounded-full animate-eq-bar h-3 [animation-delay:120ms]" />
                      <span className="w-[3px] bg-primary rounded-full animate-eq-bar h-2.5 [animation-delay:240ms]" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default MadeForYouCarousel;
