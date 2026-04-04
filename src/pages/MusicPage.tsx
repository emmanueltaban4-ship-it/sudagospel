import Layout from "@/components/Layout";
import SongCard from "@/components/SongCard";
import MiniPlayer from "@/components/MiniPlayer";
import {
  Search,
  TrendingUp,
  Clock,
  Music,
  Star,
  Play,
  Pause,
  Flame,
} from "lucide-react";
import { useSongs } from "@/hooks/use-music-data";
import { usePlayer, Track } from "@/hooks/use-player";
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";

const genres = [
  "All",
  "Gospel",
  "Worship",
  "Praises",
  "Rap",
  "Traditional",
  "Catholic Music",
  "Afrobeat",
];

const formatPlays = (count: number) => {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return `${count}`;
};

const MusicPage = () => {
  const { data: songs, isLoading } = useSongs();
  const { play, currentTrack, isPlaying, togglePlay } = usePlayer();
  const [search, setSearch] = useState("");
  const [activeGenre, setActiveGenre] = useState("All");

  const allSongs = useMemo(() => {
    if (!songs || songs.length === 0) return [];
    return songs.map((s) => ({
      id: s.id,
      title: s.title,
      artist: (s.artists as any)?.name || "Unknown",
      artistAvatar: (s.artists as any)?.avatar_url || "",
      plays: s.play_count || 0,
      coverUrl: s.cover_url || "",
      fileUrl: s.file_url,
      genre: s.genre || "Gospel",
      createdAt: s.created_at,
    }));
  }, [songs]);

  const queue: Track[] = useMemo(
    () =>
      allSongs.map((s) => ({
        id: s.id,
        title: s.title,
        artist: s.artist,
        fileUrl: s.fileUrl,
        coverUrl: s.coverUrl,
      })),
    [allSongs]
  );

  // Trending: top 10 by play count
  const trending = useMemo(
    () => [...allSongs].sort((a, b) => b.plays - a.plays).slice(0, 10),
    [allSongs]
  );

  // New Releases: latest 10
  const newReleases = useMemo(
    () =>
      [...allSongs]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 10),
    [allSongs]
  );

  // Filtered for Browse All
  const filtered = useMemo(() => {
    return allSongs.filter((s) => {
      const matchSearch =
        !search ||
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.artist.toLowerCase().includes(search.toLowerCase());
      const matchGenre =
        activeGenre === "All" ||
        s.genre.toLowerCase() === activeGenre.toLowerCase();
      return matchSearch && matchGenre;
    });
  }, [allSongs, search, activeGenre]);

  const handlePlayTrack = (song: (typeof allSongs)[0]) => {
    if (currentTrack?.id === song.id) {
      togglePlay();
    } else {
      play(
        {
          id: song.id,
          title: song.title,
          artist: song.artist,
          fileUrl: song.fileUrl,
          coverUrl: song.coverUrl,
        },
        queue
      );
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background pb-24">
        {/* Hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gospel-dark via-background to-gospel-dark">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-1/3 w-72 h-72 bg-gospel-gold rounded-full blur-[100px]" />
          </div>
          <div className="relative container py-8 md:py-12">
            <div className="flex items-center gap-2 mb-2">
              <Music className="h-5 w-5 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                Explore Music
              </span>
            </div>
            <h1 className="font-heading text-3xl md:text-5xl font-extrabold text-foreground mb-2">
              Music
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-md mb-6">
              Stream & download South Sudan's best gospel music
            </p>

            <div className="relative max-w-lg">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search songs, artists..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border-0 bg-card/80 backdrop-blur-sm pl-12 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-lg"
              />
            </div>
          </div>
        </div>

        {/* Trending Songs */}
        {trending.length > 0 && !search && (
          <div className="container py-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-primary" />
                <h2 className="font-heading text-lg md:text-xl font-bold text-foreground">
                  Trending Now
                </h2>
              </div>
              <span className="text-xs text-muted-foreground">
                {allSongs.length} songs
              </span>
            </div>
            <div className="space-y-1">
              {trending.map((song, index) => {
                const isCurrent = currentTrack?.id === song.id;
                return (
                  <div
                    key={song.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer group ${
                      isCurrent
                        ? "bg-primary/10"
                        : "hover:bg-card/80"
                    }`}
                    onClick={() => handlePlayTrack(song)}
                  >
                    <span className="text-sm font-bold text-muted-foreground w-6 text-center tabular-nums">
                      {index + 1}
                    </span>
                    <div className="relative h-12 w-12 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                      {song.coverUrl ? (
                        <img
                          src={song.coverUrl}
                          alt={song.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-primary/60 to-primary/30 flex items-center justify-center">
                          <Music className="h-5 w-5 text-primary-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {isCurrent && isPlaying ? (
                          <Pause className="h-4 w-4 text-white" />
                        ) : (
                          <Play className="h-4 w-4 text-white fill-white ml-0.5" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-heading font-semibold text-sm truncate ${
                          isCurrent ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {song.title}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {song.artist}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                      <TrendingUp className="h-3 w-3" />
                      {formatPlays(song.plays)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* New Releases Carousel */}
        {newReleases.length > 0 && !search && (
          <div className="container pb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gospel-gold" />
                <h2 className="font-heading text-lg md:text-xl font-bold text-foreground">
                  New Releases
                </h2>
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
              {newReleases.map((song) => {
                const isCurrent = currentTrack?.id === song.id;
                return (
                  <div
                    key={song.id}
                    className="snap-start flex-shrink-0 w-36 md:w-44 group cursor-pointer"
                    onClick={() => handlePlayTrack(song)}
                  >
                    <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 shadow-xl ring-1 ring-border/50 group-hover:ring-primary/50 transition-all duration-300">
                      {song.coverUrl ? (
                        <img
                          src={song.coverUrl}
                          alt={song.title}
                          className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-primary/80 to-primary/40 flex items-center justify-center">
                          <Music className="h-8 w-8 text-primary-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center shadow-lg">
                          {isCurrent && isPlaying ? (
                            <Pause className="h-5 w-5 text-primary-foreground" />
                          ) : (
                            <Play className="h-5 w-5 text-primary-foreground fill-primary-foreground ml-0.5" />
                          )}
                        </div>
                      </div>
                      {isCurrent && (
                        <div className="absolute bottom-2 left-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                          {isPlaying ? "Playing" : "Paused"}
                        </div>
                      )}
                    </div>
                    <Link to={`/song/${song.id}`}>
                      <h3 className="font-heading font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                        {song.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-muted-foreground truncate">
                      {song.artist}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Genre Filters + Browse All */}
        <div className="container pb-6">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-lg md:text-xl font-bold text-foreground">
              {search ? "Search Results" : "Browse All"}
            </h2>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => setActiveGenre(g)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                  activeGenre === g
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                    : "bg-card text-muted-foreground hover:bg-card/80 border border-border"
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square rounded-lg bg-muted mb-2" />
                  <div className="h-3 w-3/4 bg-muted rounded mb-1" />
                  <div className="h-2 w-1/2 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Music className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">No songs found</p>
              <p className="text-muted-foreground/60 text-xs mt-1">
                Try a different search or genre
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {filtered.map((song) => (
                <SongCard
                  key={song.id}
                  id={song.id}
                  title={song.title}
                  artist={song.artist}
                  coverUrl={song.coverUrl}
                  plays={formatPlays(song.plays)}
                  fileUrl={song.fileUrl}
                  queue={queue}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <MiniPlayer />
    </Layout>
  );
};

export default MusicPage;
