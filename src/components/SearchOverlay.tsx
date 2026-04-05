import { useState, useEffect, useRef } from "react";
import { Search, X, Music, User, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSongs, useArtists } from "@/hooks/use-music-data";
import { usePlayer, Track } from "@/hooks/use-player";

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

const SearchOverlay = ({ open, onClose }: SearchOverlayProps) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { data: songs } = useSongs();
  const { data: artists } = useArtists();
  const { play } = usePlayer();

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const q = query.toLowerCase().trim();

  const filteredSongs = q.length > 0
    ? (songs || []).filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          ((s.artists as any)?.name || "").toLowerCase().includes(q) ||
          (s.genre || "").toLowerCase().includes(q)
      ).slice(0, 8)
    : [];

  const filteredArtists = q.length > 0
    ? (artists || []).filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.genre || "").toLowerCase().includes(q)
      ).slice(0, 6)
    : [];

  const handlePlaySong = (song: any) => {
    const track: Track = {
      id: song.id,
      title: song.title,
      artist: (song.artists as any)?.name || "Unknown",
      fileUrl: song.file_url,
      coverUrl: song.cover_url || "",
    };
    play(track);
    onClose();
  };

  const handleViewSong = (songId: string) => {
    navigate(`/song/${songId}`);
    onClose();
  };

  const handleViewArtist = (artistId: string) => {
    navigate(`/artist/${artistId}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="container max-w-lg mx-auto pt-4">
        {/* Search input */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search songs, artists, genres..."
              className="w-full rounded-full border border-input bg-card pl-11 pr-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2.5 text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Results */}
        <div className="overflow-y-auto max-h-[calc(100vh-100px)] space-y-6 pb-8">
          {q.length === 0 && (
            <p className="text-center text-muted-foreground text-sm pt-12">
              Start typing to search songs and artists...
            </p>
          )}

          {q.length > 0 && filteredSongs.length === 0 && filteredArtists.length === 0 && (
            <p className="text-center text-muted-foreground text-sm pt-12">
              No results for "{query}"
            </p>
          )}

          {/* Artists results */}
          {filteredArtists.length > 0 && (
            <div>
              <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">
                Artists
              </h3>
              <div className="space-y-1">
                {filteredArtists.map((artist) => (
                  <button
                    key={artist.id}
                    onClick={() => handleViewArtist(artist.id)}
                    className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted transition-colors text-left"
                  >
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-gradient-brand flex-shrink-0">
                      {artist.avatar_url ? (
                        <img src={artist.avatar_url} alt={artist.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-sm font-bold text-primary-foreground">
                          {artist.name[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{artist.name}</p>
                      <p className="text-xs text-muted-foreground">{artist.genre || "Gospel"} · Artist</p>
                    </div>
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Songs results */}
          {filteredSongs.length > 0 && (
            <div>
              <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">
                Songs
              </h3>
              <div className="space-y-1">
                {filteredSongs.map((song) => (
                  <div
                    key={song.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted transition-colors group"
                  >
                    <button
                      onClick={() => handlePlaySong(song)}
                      className="relative h-10 w-10 rounded-md overflow-hidden bg-muted flex-shrink-0"
                    >
                      {song.cover_url ? (
                        <img src={song.cover_url} alt={song.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Music className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="h-4 w-4 text-white fill-white" />
                      </div>
                    </button>
                    <button
                      onClick={() => handleViewSong(song.id)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <p className="font-medium text-sm text-foreground truncate">{song.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {(song.artists as any)?.name || "Unknown"} · {song.genre || "Gospel"}
                      </p>
                    </button>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {song.play_count || 0} plays
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchOverlay;
