import Layout from "@/components/Layout";
import SongCard from "@/components/SongCard";
import MiniPlayer from "@/components/MiniPlayer";
import { Search, TrendingUp, Clock, Music, Play, Pause, Flame } from "lucide-react";
import { useSongs } from "@/hooks/use-music-data";
import { usePlayer, Track } from "@/hooks/use-player";
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";

const genres = ["All", "Gospel", "Worship", "Praises", "Rap", "Traditional", "Catholic Music", "Afrobeat"];

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
      artistId: (s.artists as any)?.id,
      plays: s.play_count || 0,
      coverUrl: s.cover_url || "",
      fileUrl: s.file_url,
      genre: s.genre || "Gospel",
      createdAt: s.created_at,
    }));
  }, [songs]);

  const queue: Track[] = useMemo(
    () => allSongs.map((s) => ({ id: s.id, title: s.title, artist: s.artist, fileUrl: s.fileUrl, coverUrl: s.coverUrl })),
    [allSongs]
  );

  const trending = useMemo(() => [...allSongs].sort((a, b) => b.plays - a.plays).slice(0, 10), [allSongs]);
  const newReleases = useMemo(() => [...allSongs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10), [allSongs]);

  const filtered = useMemo(() => {
    return allSongs.filter((s) => {
      const matchSearch = !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.artist.toLowerCase().includes(search.toLowerCase());
      const matchGenre = activeGenre === "All" || s.genre.toLowerCase() === activeGenre.toLowerCase();
      return matchSearch && matchGenre;
    });
  }, [allSongs, search, activeGenre]);

  const handlePlayTrack = (song: (typeof allSongs)[0]) => {
    if (currentTrack?.id === song.id) {
      togglePlay();
    } else {
      play({ id: song.id, title: song.title, artist: song.artist, fileUrl: song.fileUrl, coverUrl: song.coverUrl }, queue);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen pb-24">
        {/* Search bar */}
        <div className="px-4 lg:px-6 pt-6 pb-4">
          <div className="relative max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search songs, artists..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full bg-muted pl-11 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Trending Songs */}
        {trending.length > 0 && !search && (
          <div className="px-4 lg:px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-sm md:text-base font-black text-foreground tracking-wide">TRENDING SONGS</h2>
              <span className="text-xs text-muted-foreground">{allSongs.length} songs</span>
            </div>
            <div className="space-y-0.5">
              {trending.map((song, index) => {
                const isCurrent = currentTrack?.id === song.id;
                return (
                  <div
                    key={song.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer group ${isCurrent ? "bg-primary/10" : "hover:bg-muted/50"}`}
                    onClick={() => handlePlayTrack(song)}
                  >
                    <span className={`text-sm font-black w-6 text-center tabular-nums ${index < 3 ? "text-primary" : "text-muted-foreground"}`}>
                      {index + 1}
                    </span>
                    <div className="relative h-10 w-10 rounded overflow-hidden flex-shrink-0 bg-muted">
                      {song.coverUrl ? (
                        <img src={song.coverUrl} alt={song.title} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Music className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {isCurrent && isPlaying ? <Pause className="h-3.5 w-3.5 text-white" /> : <Play className="h-3.5 w-3.5 text-white fill-white ml-0.5" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold text-sm truncate ${isCurrent ? "text-primary" : "text-foreground"}`}>{song.title}</h3>
                      <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground flex-shrink-0">
                      <TrendingUp className="h-3 w-3" />
                      {formatPlays(song.plays)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* New Releases */}
        {newReleases.length > 0 && !search && (
          <div className="px-4 lg:px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-sm md:text-base font-black text-foreground tracking-wide">RECENTLY ADDED</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {newReleases.map((song) => {
                const isCurrent = currentTrack?.id === song.id;
                return (
                  <div key={song.id} className="flex-shrink-0 w-36 md:w-44 group cursor-pointer" onClick={() => handlePlayTrack(song)}>
                    <div className="relative aspect-square rounded-lg overflow-hidden mb-2 bg-muted">
                      {song.coverUrl ? (
                        <img src={song.coverUrl} alt={song.title} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center"><Music className="h-8 w-8 text-muted-foreground" /></div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                          {isCurrent && isPlaying ? <Pause className="h-4 w-4 text-primary-foreground" /> : <Play className="h-4 w-4 text-primary-foreground fill-primary-foreground ml-0.5" />}
                        </div>
                      </div>
                      {isCurrent && (
                        <div className="absolute bottom-1.5 left-1.5 rounded bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                          {isPlaying ? "Playing" : "Paused"}
                        </div>
                      )}
                    </div>
                    <Link to={`/song/${song.id}`}>
                      <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">{song.title}</h3>
                    </Link>
                    <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Genre Filters + Browse All */}
        <div className="px-4 lg:px-6 py-4">
          <h2 className="font-heading text-sm md:text-base font-black text-foreground tracking-wide mb-4">
            {search ? "SEARCH RESULTS" : "BROWSE ALL"}
          </h2>

          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => setActiveGenre(g)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                  activeGenre === g
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
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
              <p className="text-muted-foreground/60 text-xs mt-1">Try a different search or genre</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
