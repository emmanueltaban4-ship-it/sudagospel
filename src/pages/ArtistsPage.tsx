import Layout from "@/components/Layout";
import MiniPlayer from "@/components/MiniPlayer";
import { Search, TrendingUp, Star, Users, ChevronRight, Play } from "lucide-react";
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

  // Featured artists: top 5 by song count
  const featured = useMemo(() => {
    return [...mappedArtists]
      .filter((a) => a.avatarUrl && a.songs > 0)
      .sort((a, b) => b.songs - a.songs)
      .slice(0, 5);
  }, [mappedArtists]);

  // Trending: verified artists with songs
  const trending = useMemo(() => {
    return mappedArtists
      .filter((a) => a.isVerified && a.songs > 0)
      .slice(0, 8);
  }, [mappedArtists]);

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gospel-dark via-background to-gospel-dark">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-gospel-gold rounded-full blur-[100px]" />
          </div>
          <div className="relative container py-8 md:py-12">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-5 w-5 text-primary fill-primary" />
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                Discover Artists
              </span>
            </div>
            <h1 className="font-heading text-3xl md:text-5xl font-extrabold text-foreground mb-2">
              Artists
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-md mb-6">
              Explore South Sudan's finest gospel musicians
            </p>

            {/* Search */}
            <div className="relative max-w-lg">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search artists..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border-0 bg-card/80 backdrop-blur-sm pl-12 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-lg"
              />
            </div>
          </div>
        </div>

        {/* Featured Artists Carousel */}
        {featured.length > 0 && !search && (
          <div className="container py-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="font-heading text-lg md:text-xl font-bold text-foreground">
                  Featured Artists
                </h2>
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
              {featured.map((artist) => (
                <Link
                  key={artist.id}
                  to={`/artist/${artist.id}`}
                  className="snap-start flex-shrink-0 group"
                >
                  <div className="relative w-36 md:w-44">
                    <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 shadow-xl ring-1 ring-border/50 group-hover:ring-primary/50 transition-all duration-300">
                      {artist.avatarUrl ? (
                        <img
                          src={artist.avatarUrl}
                          alt={artist.name}
                          className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-primary/80 to-primary/40 flex items-center justify-center">
                          <span className="text-4xl font-heading font-bold text-primary-foreground">
                            {artist.name[0]}
                          </span>
                        </div>
                      )}
                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {/* Play button on hover */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center shadow-lg">
                          <Play className="h-5 w-5 text-primary-foreground fill-primary-foreground ml-0.5" />
                        </div>
                      </div>
                      {/* Verified badge */}
                      {artist.isVerified && (
                        <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-md">
                          <Star className="h-3 w-3 text-primary-foreground fill-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-heading font-bold text-sm text-foreground truncate">
                      {artist.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {artist.songs} songs · {artist.genre}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Trending Artists Row */}
        {trending.length > 0 && !search && (
          <div className="container pb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gospel-gold" />
                <h2 className="font-heading text-lg md:text-xl font-bold text-foreground">
                  Trending Artists
                </h2>
              </div>
              <span className="text-xs text-muted-foreground">
                {mappedArtists.length} artists
              </span>
            </div>
            <div className="space-y-1">
              {trending.map((artist, index) => (
                <Link
                  key={artist.id}
                  to={`/artist/${artist.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-card/80 transition-colors group"
                >
                  <span className="text-sm font-bold text-muted-foreground w-6 text-center tabular-nums">
                    {index + 1}
                  </span>
                  <div className="h-12 w-12 rounded-full overflow-hidden ring-2 ring-border group-hover:ring-primary/50 transition-all flex-shrink-0">
                    {artist.avatarUrl ? (
                      <img
                        src={artist.avatarUrl}
                        alt={artist.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary/60 to-primary/30 flex items-center justify-center">
                        <span className="text-lg font-heading font-bold text-primary-foreground">
                          {artist.name[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-heading font-semibold text-sm text-foreground truncate">
                        {artist.name}
                      </h3>
                      {artist.isVerified && (
                        <Star className="h-3.5 w-3.5 text-primary fill-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {artist.genre} · {artist.songs} songs
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Filter Chips + Browse All */}
        <div className="container pb-6">
          <h2 className="font-heading text-lg md:text-xl font-bold text-foreground mb-4">
            {search ? "Search Results" : "Browse All"}
          </h2>

          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                  activeFilter === f
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                    : "bg-card text-muted-foreground hover:bg-card/80 border border-border"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Artists Grid */}
          {isLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 md:gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
                  <div className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-muted" />
                  <div className="h-3 w-16 bg-muted rounded" />
                  <div className="h-2 w-12 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">No artists found</p>
              <p className="text-muted-foreground/60 text-xs mt-1">
                Try a different search or filter
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 md:gap-6">
              {filtered.map((artist) => (
                <Link
                  key={artist.id}
                  to={`/artist/${artist.id}`}
                  className="flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <div className="relative h-20 w-20 md:h-24 md:w-24 rounded-full overflow-hidden ring-2 ring-border group-hover:ring-primary transition-all duration-300 shadow-md group-hover:shadow-lg group-hover:shadow-primary/10">
                    {artist.avatarUrl ? (
                      <img
                        src={artist.avatarUrl}
                        alt={artist.name}
                        className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary/70 to-primary/30 flex items-center justify-center">
                        <span className="text-2xl font-heading font-bold text-primary-foreground">
                          {artist.name[0]}
                        </span>
                      </div>
                    )}
                    {artist.isVerified && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-full bg-primary flex items-center justify-center ring-2 ring-background">
                        <Star className="h-3 w-3 text-primary-foreground fill-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="text-center max-w-full px-1">
                    <h3 className="font-heading font-semibold text-xs md:text-sm text-foreground truncate">
                      {artist.name}
                    </h3>
                    <p className="text-[10px] md:text-xs text-muted-foreground">
                      {artist.songs} songs
                    </p>
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
