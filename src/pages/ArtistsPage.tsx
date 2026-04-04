import Layout from "@/components/Layout";
import MiniPlayer from "@/components/MiniPlayer";
import { Search, Star, Users, ChevronRight, Play } from "lucide-react";
import { useArtists } from "@/hooks/use-music-data";
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";

const ArtistsPage = () => {
  const { data: artists, isLoading } = useArtists();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const filters = ["All", "Verified", "Gospel", "Worship", "Rap", "Traditional"];

  const mappedArtists = useMemo(() => {
    if (!artists || artists.length === 0) return [];
    return artists.map((a) => ({
      id: a.id,
      name: a.name,
      genre: a.genre || "Gospel",
      songs: (a.songs as any)?.[0]?.count || 0,
      avatarUrl: a.avatar_url,
      isVerified: a.is_verified || false,
    }));
  }, [artists]);

  const filtered = useMemo(() => {
    return mappedArtists.filter((a) => {
      const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        activeFilter === "All" ||
        (activeFilter === "Verified" && a.isVerified) ||
        a.genre.toLowerCase() === activeFilter.toLowerCase();
      return matchSearch && matchFilter;
    });
  }, [mappedArtists, search, activeFilter]);

  const featured = useMemo(() => {
    return [...mappedArtists].filter((a) => a.avatarUrl && a.songs > 0).sort((a, b) => b.songs - a.songs).slice(0, 6);
  }, [mappedArtists]);

  const trending = useMemo(() => {
    return mappedArtists.filter((a) => a.isVerified && a.songs > 0).slice(0, 8);
  }, [mappedArtists]);

  return (
    <Layout>
      <div className="min-h-screen pb-24">
        {/* Search */}
        <div className="px-4 lg:px-6 pt-6 pb-4">
          <div className="relative max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search artists..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full bg-muted pl-11 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Featured Artists */}
        {featured.length > 0 && !search && (
          <div className="px-4 lg:px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-sm md:text-base font-black text-foreground tracking-wide">FEATURED ARTISTS</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {featured.map((artist) => (
                <Link key={artist.id} to={`/artist/${artist.id}`} className="flex-shrink-0 group">
                  <div className="w-36 md:w-44">
                    <div className="relative aspect-square rounded-lg overflow-hidden mb-2 bg-muted">
                      {artist.avatarUrl ? (
                        <img src={artist.avatarUrl} alt={artist.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-4xl font-heading font-bold text-muted-foreground">{artist.name[0]}</div>
                      )}
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                          <Play className="h-5 w-5 text-primary-foreground fill-primary-foreground ml-0.5" />
                        </div>
                      </div>
                      {artist.isVerified && (
                        <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <Star className="h-2.5 w-2.5 text-primary-foreground fill-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">{artist.name}</h3>
                    <p className="text-xs text-muted-foreground">{artist.songs} songs · {artist.genre}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Trending Artists List */}
        {trending.length > 0 && !search && (
          <div className="px-4 lg:px-6 py-4">
            <h2 className="font-heading text-sm md:text-base font-black text-foreground tracking-wide mb-4">TRENDING ARTISTS</h2>
            <div className="space-y-0.5">
              {trending.map((artist, index) => (
                <Link
                  key={artist.id}
                  to={`/artist/${artist.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <span className="text-sm font-black text-muted-foreground w-6 text-center tabular-nums">{index + 1}</span>
                  <div className="h-10 w-10 rounded-full overflow-hidden ring-2 ring-transparent group-hover:ring-primary transition-all flex-shrink-0 bg-muted">
                    {artist.avatarUrl ? (
                      <img src={artist.avatarUrl} alt={artist.name} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-lg font-bold text-muted-foreground">{artist.name[0]}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-sm text-foreground truncate">{artist.name}</h3>
                      {artist.isVerified && <Star className="h-3 w-3 text-primary fill-primary flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{artist.genre} · {artist.songs} songs</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Filter + Browse All */}
        <div className="px-4 lg:px-6 py-4">
          <h2 className="font-heading text-sm md:text-base font-black text-foreground tracking-wide mb-4">
            {search ? "SEARCH RESULTS" : "ALL ARTISTS"}
          </h2>

          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                  activeFilter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 md:gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
                  <div className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-muted" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">No artists found</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 md:gap-6">
              {filtered.map((artist) => (
                <Link key={artist.id} to={`/artist/${artist.id}`} className="flex flex-col items-center gap-2 group cursor-pointer">
                  <div className="relative h-20 w-20 md:h-24 md:w-24 rounded-full overflow-hidden ring-2 ring-transparent group-hover:ring-primary transition-all duration-300 bg-muted">
                    {artist.avatarUrl ? (
                      <img src={artist.avatarUrl} alt={artist.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-2xl font-heading font-bold text-muted-foreground">{artist.name[0]}</div>
                    )}
                    {artist.isVerified && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center ring-2 ring-background">
                        <Star className="h-2.5 w-2.5 text-primary-foreground fill-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="text-center max-w-full px-1">
                    <h3 className="font-semibold text-xs md:text-sm text-foreground truncate group-hover:text-primary transition-colors">{artist.name}</h3>
                    <p className="text-[10px] text-muted-foreground">{artist.songs} songs</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <MiniPlayer />
    </Layout>
  );
};

export default ArtistsPage;
