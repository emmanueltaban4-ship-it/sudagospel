import { ArrowRight, Play, Pause, Music, TrendingUp, Clock, Headphones, Youtube, Mic2, HandMetal, Users2, BookOpen, Trophy, Sparkles, Disc3, Flame, Heart, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { artistPath } from "@/lib/artist-slug";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import HeroSection from "@/components/HeroSection";
import MiniPlayer from "@/components/MiniPlayer";
import AdBanner from "@/components/AdBanner";
import { usePlayer, Track } from "@/hooks/use-player";
import { useMemo } from "react";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { useAuth } from "@/hooks/use-auth";

const Index = () => {
  const { play, currentTrack, isPlaying, togglePlay } = usePlayer();
  const { data: siteSettings } = useSiteSettings();
  const { user } = useAuth();

  const { data: trendingSongs } = useQuery({
    queryKey: ["trending-songs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("songs")
        .select("*, artists(id, name, avatar_url)")
        .eq("is_approved", true)
        .order("play_count", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const { data: recentSongs } = useQuery({
    queryKey: ["recent-songs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("songs")
        .select("*, artists(id, name, avatar_url)")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const { data: topArtists } = useQuery({
    queryKey: ["top-artists-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artists")
        .select("*, songs(count)")
        .eq("is_verified", true)
        .order("name")
        .limit(12);
      if (error) throw error;
      return data;
    },
  });

  const { data: weeklyTopSongs } = useQuery({
    queryKey: ["weekly-top-songs"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_weekly_top_songs", { lim: 10 });
      if (error) throw error;
      return data;
    },
  });

  const { data: albums } = useQuery({
    queryKey: ["albums-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("albums")
        .select("*, artists(id, name, avatar_url), songs(count)")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const { data: youtubeArtists } = useQuery({
    queryKey: ["youtube-artists-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artists")
        .select("id, name, avatar_url, youtube_channel_url")
        .eq("is_verified", true)
        .not("youtube_channel_url", "is", null)
        .limit(8);
      if (error) throw error;
      return data?.filter((a) => a.youtube_channel_url?.trim()) || [];
    },
  });

  const { data: recommendedSongs } = useQuery({
    queryKey: ["recommended-songs", user?.id],
    queryFn: async () => {
      const { data: likedSongs } = await supabase
        .from("song_likes")
        .select("song_id")
        .eq("user_id", user!.id)
        .limit(50);
      if (!likedSongs?.length) {
        const { data } = await supabase
          .from("songs")
          .select("*, artists(id, name, avatar_url)")
          .eq("is_approved", true)
          .order("play_count", { ascending: false })
          .limit(10);
        return data || [];
      }
      const likedIds = likedSongs.map((l) => l.song_id);
      const { data: likedDetails } = await supabase
        .from("songs")
        .select("genre")
        .in("id", likedIds);
      const genres = [...new Set((likedDetails || []).map((s) => s.genre).filter(Boolean))];
      if (genres.length === 0) {
        const { data } = await supabase
          .from("songs")
          .select("*, artists(id, name, avatar_url)")
          .eq("is_approved", true)
          .not("id", "in", `(${likedIds.join(",")})`)
          .order("play_count", { ascending: false })
          .limit(10);
        return data || [];
      }
      const { data } = await supabase
        .from("songs")
        .select("*, artists(id, name, avatar_url)")
        .eq("is_approved", true)
        .in("genre", genres)
        .not("id", "in", `(${likedIds.join(",")})`)
        .order("play_count", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!user,
  });

  const playSong = (song: any) => {
    const artistName = (song.artists as any)?.name || "Unknown";
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
    <Layout>
      <HeroSection />

      {/* Quick Genre Pills */}
      <section className="px-4 lg:px-6 py-4">
        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
          {[
            { label: "Worship", icon: Mic2, color: "from-primary/15 to-primary/5 border-primary/20 text-primary" },
            { label: "Praise", icon: HandMetal, color: "from-secondary/15 to-secondary/5 border-secondary/20 text-secondary" },
            { label: "Choir", icon: Users2, color: "from-primary/15 to-secondary/5 border-primary/20 text-primary" },
            { label: "Afrobeat", icon: Flame, color: "from-orange-500/15 to-orange-500/5 border-orange-500/20 text-orange-400" },
            { label: "Reggae", icon: Heart, color: "from-green-500/15 to-green-500/5 border-green-500/20 text-green-400" },
            { label: "Catholic", icon: Star, color: "from-blue-400/15 to-blue-400/5 border-blue-400/20 text-blue-400" },
          ].map((cat) => (
            <Link
              key={cat.label}
              to={`/music?genre=${cat.label}`}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r ${cat.color} border backdrop-blur-sm hover:scale-[1.03] transition-all active:scale-95`}
            >
              <cat.icon className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Top Ad */}
      <div className="px-4 lg:px-6 py-1">
        <AdBanner position="homepage_top" />
      </div>

      {/* Trending Songs */}
      {trendingSongs && trendingSongs.length > 0 && (
        <section className="py-6">
          <div className="px-4 lg:px-6">
            <SectionHeader title="Trending Now" icon={<TrendingUp className="h-5 w-5 text-primary" />} linkTo="/music" />
          </div>
          <div className="px-4 lg:px-6 overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 pb-1">
              {trendingSongs.map((song, idx) => (
                <SongCard key={song.id} song={song} onPlay={playSong} currentTrack={currentTrack} isPlaying={isPlaying} rank={idx + 1} showRank />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recommended */}
      {recommendedSongs && recommendedSongs.length > 0 && (
        <section className="py-6">
          <div className="px-4 lg:px-6">
            <SectionHeader title="Recommended for You" icon={<Sparkles className="h-5 w-5 text-primary" />} linkTo="/music" />
          </div>
          <div className="px-4 lg:px-6 overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 pb-1">
              {recommendedSongs.map((song: any) => (
                <SongCard key={song.id} song={song} onPlay={playSong} currentTrack={currentTrack} isPlaying={isPlaying} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Weekly Top 10 — Premium Chart Card */}
      {weeklyTopSongs && weeklyTopSongs.length > 0 && (
        <section className="py-6">
          <div className="px-4 lg:px-6">
            <SectionHeader title="Top 10 This Week" icon={<Trophy className="h-5 w-5 text-primary" />} linkTo="/most-listened" />
            <div className="rounded-2xl overflow-hidden border border-primary/10 bg-gradient-to-b from-card via-card to-primary/[0.03]">
              {weeklyTopSongs.map((song: any, idx: number) => (
                <div
                  key={song.song_id}
                  className={`flex items-center gap-3 px-4 py-3.5 group hover:bg-primary/5 transition-all cursor-pointer ${
                    currentTrack?.id === song.song_id ? "bg-primary/8" : ""
                  } ${idx < weeklyTopSongs.length - 1 ? "border-b border-border/50" : ""}`}
                  onClick={() => {
                    const track: Track = {
                      id: song.song_id,
                      title: song.title,
                      artist: song.artist_name,
                      fileUrl: song.file_url,
                      coverUrl: song.cover_url || undefined,
                    };
                    if (currentTrack?.id === song.song_id) togglePlay();
                    else play(track);
                  }}
                >
                  <span className={`text-lg font-heading font-black w-8 text-center tabular-nums ${
                    idx === 0 ? "text-primary" : idx === 1 ? "text-primary/70" : idx === 2 ? "text-primary/50" : "text-muted-foreground/30"
                  }`}>
                    {idx + 1}
                  </span>
                  <div className="relative h-12 w-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted shadow-sm ring-1 ring-border/50">
                    {song.cover_url ? (
                      <img src={song.cover_url} alt={song.title} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs font-bold text-muted-foreground bg-gradient-to-br from-primary/10 to-secondary/10">
                        {song.title[0]}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {currentTrack?.id === song.song_id && isPlaying ? (
                        <Pause className="h-4 w-4 text-white" />
                      ) : (
                        <Play className="h-4 w-4 text-white" fill="white" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${currentTrack?.id === song.song_id ? "text-primary" : "text-foreground"}`}>
                      {song.title}
                    </p>
                    <Link
                      to={artistPath(song.artist_name)}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors truncate block"
                    >
                      {song.artist_name}
                    </Link>
                  </div>
                  <span className="text-[10px] text-muted-foreground/60 tabular-nums hidden sm:block">
                    {Number(song.total_score)} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular Artists */}
      {topArtists && topArtists.length > 0 && (
        <section className="py-6">
          <div className="px-4 lg:px-6">
            <SectionHeader title="Popular Artists" linkTo="/artists" />
          </div>
          <div className="px-4 lg:px-6 overflow-x-auto scrollbar-hide">
            <div className="flex gap-5 pb-1">
              {topArtists.map((artist) => (
                <Link key={artist.id} to={artistPath(artist.name)} className="flex-shrink-0 group">
                  <div className="w-28 md:w-36 flex flex-col items-center gap-3">
                    <div className="relative">
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden ring-2 ring-transparent group-hover:ring-primary/40 transition-all duration-300 shadow-lg group-hover:shadow-primary/20">
                        {artist.avatar_url ? (
                          <img src={artist.avatar_url} alt={artist.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-2xl font-heading font-bold text-muted-foreground">
                            {artist.name[0]}
                          </div>
                        )}
                      </div>
                      {artist.is_verified && (
                        <div className="absolute -bottom-1 right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center ring-2 ring-background shadow-sm">
                          <Star className="h-3 w-3 text-primary-foreground" fill="currentColor" />
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-foreground truncate w-full group-hover:text-primary transition-colors">{artist.name}</p>
                      <p className="text-[10px] text-muted-foreground">{(artist.songs as any)?.[0]?.count || 0} songs</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Albums */}
      {albums && albums.length > 0 && (
        <section className="py-6">
          <div className="px-4 lg:px-6">
            <SectionHeader title="Albums" icon={<Disc3 className="h-5 w-5 text-primary" />} linkTo="/music" />
          </div>
          <div className="px-4 lg:px-6 overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 pb-1">
              {albums.map((album) => {
                const artist = album.artists as any;
                return (
                  <Link key={album.id} to={`/album/${album.id}`} className="flex-shrink-0 w-40 md:w-48 group">
                    <div className="relative aspect-square rounded-2xl overflow-hidden mb-2.5 bg-muted shadow-lg ring-1 ring-border/30 group-hover:ring-primary/30 group-hover:shadow-primary/10 transition-all duration-300">
                      {album.cover_url ? (
                        <img src={album.cover_url} alt={album.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-secondary/20 to-primary/10 flex items-center justify-center">
                          <Disc3 className="h-10 w-10 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm rounded-full px-2.5 py-0.5 text-[10px] font-bold text-foreground shadow-sm">
                        {(album.songs as any)?.[0]?.count || 0} songs
                      </div>
                    </div>
                    <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                      {album.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {artist?.name || "Unknown"}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* YouTube Videos */}
      {youtubeArtists && youtubeArtists.length > 0 && (
        <section className="py-6">
          <div className="px-4 lg:px-6">
            <SectionHeader title="Watch Videos" icon={<Youtube className="h-5 w-5 text-red-500" />} linkTo="/videos" />
          </div>
          <div className="px-4 lg:px-6 overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 pb-1">
              {youtubeArtists.map((artist) => {
                const channelUrl = artist.youtube_channel_url!;
                const fullUrl = channelUrl.startsWith("http")
                  ? channelUrl
                  : `https://www.youtube.com/${channelUrl.startsWith("@") ? channelUrl : `@${channelUrl}`}`;
                return (
                  <a
                    key={artist.id}
                    href={fullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 w-52 md:w-64 group"
                  >
                    <div className="relative aspect-video rounded-xl overflow-hidden mb-2.5 bg-muted shadow-md border border-border/50 group-hover:border-red-500/30 transition-all">
                      <div className="h-full w-full bg-gradient-to-br from-red-500/10 to-red-900/20 flex flex-col items-center justify-center gap-2">
                        {artist.avatar_url ? (
                          <img src={artist.avatar_url} alt={artist.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-red-500/30" loading="lazy" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground">
                            {artist.name[0]}
                          </div>
                        )}
                        <Youtube className="h-5 w-5 text-red-500" />
                      </div>
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-xl">
                          <Play className="h-5 w-5 text-white ml-0.5" fill="currentColor" />
                        </div>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-foreground truncate group-hover:text-red-500 transition-colors">
                      {artist.name}
                    </p>
                    <p className="text-xs text-muted-foreground">YouTube Channel</p>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Mid Ad */}
      <div className="px-4 lg:px-6 py-2">
        <AdBanner position="homepage_mid" />
      </div>

      {/* Fresh Releases */}
      {recentSongs && recentSongs.length > 0 && (
        <section className="py-6">
          <div className="px-4 lg:px-6">
            <SectionHeader title="Fresh Releases" icon={<Clock className="h-5 w-5 text-secondary" />} linkTo="/new-songs" />
          </div>
          <div className="px-4 lg:px-6 overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 pb-1">
              {recentSongs.map((song) => (
                <SongCard key={song.id} song={song} onPlay={playSong} currentTrack={currentTrack} isPlaying={isPlaying} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Top Chart */}
      {trendingSongs && trendingSongs.length > 0 && (
        <section className="py-6">
          <div className="px-4 lg:px-6">
            <SectionHeader title="Top Chart" linkTo="/music" />
            <div className="rounded-2xl overflow-hidden border border-border/50 bg-card/50">
              {trendingSongs.slice(0, 10).map((song, idx) => (
                <ChartRow key={song.id} song={song} rank={idx + 1} onPlay={playSong} currentTrack={currentTrack} isPlaying={isPlaying} isLast={idx === Math.min(9, trendingSongs.length - 1)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Upload CTA */}
      <section className="px-4 lg:px-6 py-8">
        <div className="relative rounded-3xl overflow-hidden border border-primary/15 p-8 md:p-14 text-center">
          {/* Decorative background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-card to-secondary/8" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 rounded-full blur-[60px]" />

          <div className="relative">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-gold mb-5 shadow-xl shadow-primary/20">
              <Headphones className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="font-heading text-2xl md:text-3xl font-black text-foreground mb-3 tracking-tight">
              Share Your Music with the World
            </h3>
            <p className="text-sm text-muted-foreground mb-7 max-w-md mx-auto leading-relaxed">
              Upload your gospel music for free and reach fans across South Sudan and beyond.
            </p>
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 bg-gradient-gold text-primary-foreground font-bold text-sm rounded-full px-8 py-3.5 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-primary/30 hover:shadow-primary/50"
            >
              Start Uploading <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="px-4 lg:px-6 text-center">
          <p className="font-heading font-black text-foreground text-base mb-1">{siteSettings?.site_name || "Sudagospel"}</p>
          <p className="text-xs text-muted-foreground">{siteSettings?.tagline || "South Sudan's premier gospel music platform."}</p>
          <p className="text-[10px] text-muted-foreground/50 mt-3">{siteSettings?.footer_text || "© 2026 Sudagospel.net. All rights reserved."}</p>
        </div>
      </footer>

      <MiniPlayer />
    </Layout>
  );
};

/* ─── Sub-components ─── */

const SectionHeader = ({ title, icon, linkTo }: { title: string; icon?: React.ReactNode; linkTo: string }) => (
  <div className="flex items-center justify-between mb-5">
    <div className="flex items-center gap-2.5">
      {icon}
      <h2 className="font-heading text-lg md:text-xl font-black text-foreground tracking-tight">
        {title}
      </h2>
    </div>
    <Link to={linkTo} className="text-xs font-bold text-primary/70 hover:text-primary transition-colors flex items-center gap-1">
      Show all <ArrowRight className="h-3 w-3" />
    </Link>
  </div>
);

const SongCard = ({ song, onPlay, currentTrack, isPlaying, rank, showRank }: any) => {
  const artist = song.artists as any;
  const artistName = artist?.name || "Unknown";
  const isCurrent = currentTrack?.id === song.id;

  return (
    <div className="flex-shrink-0 w-36 md:w-44 group cursor-pointer">
      <div
        className="relative aspect-square rounded-2xl overflow-hidden mb-2.5 bg-muted shadow-lg ring-1 ring-border/30 group-hover:ring-primary/30 group-hover:shadow-primary/10 transition-all duration-300"
        onClick={() => onPlay(song)}
      >
        {song.cover_url ? (
          <img src={song.cover_url} alt={song.title} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
            <Music className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center shadow-2xl backdrop-blur-sm scale-75 group-hover:scale-100 transition-transform duration-300">
            {isCurrent && isPlaying ? (
              <Pause className="h-5 w-5 text-primary-foreground" />
            ) : (
              <Play className="h-5 w-5 text-primary-foreground ml-0.5" fill="currentColor" />
            )}
          </div>
        </div>
        {/* Rank badge */}
        {showRank && rank && (
          <div className="absolute top-2 left-2 w-7 h-7 rounded-lg bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <span className="text-[11px] font-black text-primary-foreground">{rank}</span>
          </div>
        )}
        {/* Now playing indicator */}
        {isCurrent && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[9px] font-bold text-primary-foreground shadow-md">
            <span className="flex gap-[1px]">
              <span className="w-[2px] h-1.5 bg-primary-foreground rounded-full animate-eq-bar" />
              <span className="w-[2px] h-2 bg-primary-foreground rounded-full animate-eq-bar [animation-delay:150ms]" />
              <span className="w-[2px] h-1 bg-primary-foreground rounded-full animate-eq-bar [animation-delay:300ms]" />
            </span>
            {isPlaying ? "Playing" : "Paused"}
          </div>
        )}
      </div>
      <Link to={`/song/${song.id}`} className="text-sm font-bold text-foreground truncate block group-hover:text-primary transition-colors">
        {song.title}
      </Link>
      <Link to={artistPath(artist?.name || '')} className="text-xs text-muted-foreground hover:text-primary transition-colors truncate block mt-0.5">
        {artistName}
      </Link>
    </div>
  );
};

const ChartRow = ({ song, rank, onPlay, currentTrack, isPlaying, isLast }: any) => {
  const artist = song.artists as any;
  const artistName = artist?.name || "Unknown";
  const isCurrent = currentTrack?.id === song.id;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 group hover:bg-primary/5 transition-all cursor-pointer ${isCurrent ? "bg-primary/8" : ""} ${!isLast ? "border-b border-border/50" : ""}`}
      onClick={() => onPlay(song)}
    >
      <span className={`text-lg font-heading font-black w-8 text-center tabular-nums ${rank <= 3 ? "text-primary" : "text-muted-foreground/30"}`}>
        {rank}
      </span>
      <div className="relative h-12 w-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted shadow-sm ring-1 ring-border/50">
        {song.cover_url ? (
          <img src={song.cover_url} alt={song.title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-xs font-bold text-muted-foreground bg-gradient-to-br from-primary/10 to-secondary/10">
            {song.title[0]}
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {isCurrent && isPlaying ? (
            <Pause className="h-4 w-4 text-white" />
          ) : (
            <Play className="h-4 w-4 text-white" fill="white" />
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${isCurrent ? "text-primary" : "text-foreground"}`}>
          {song.title}
        </p>
        <Link
          to={artistPath(artist?.name || '')}
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-muted-foreground hover:text-primary transition-colors truncate block"
        >
          {artistName}
        </Link>
      </div>
      <span className="text-xs text-muted-foreground/60 tabular-nums">
        {(song.play_count || 0) >= 1000
          ? `${(song.play_count / 1000).toFixed(1)}K`
          : song.play_count || 0}
      </span>
    </div>
  );
};

export default Index;
