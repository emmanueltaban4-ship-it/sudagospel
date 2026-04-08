import { ArrowRight, Play, Pause, Music, TrendingUp, Clock, Headphones, Youtube, Mic2, HandMetal, Users2, BookOpen, Trophy, Sparkles } from "lucide-react";
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

  // Recommended: songs from genres the user has liked
  const { data: recommendedSongs } = useQuery({
    queryKey: ["recommended-songs", user?.id],
    queryFn: async () => {
      // Get genres the user likes
      const { data: likedSongs } = await supabase
        .from("song_likes")
        .select("song_id")
        .eq("user_id", user!.id)
        .limit(50);
      if (!likedSongs?.length) {
        // Fallback: random approved songs
        const { data } = await supabase
          .from("songs")
          .select("*, artists(id, name, avatar_url)")
          .eq("is_approved", true)
          .order("play_count", { ascending: false })
          .limit(10);
        return data || [];
      }
      const likedIds = likedSongs.map((l) => l.song_id);
      // Get genres from liked songs
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
      // Get songs in those genres that user hasn't liked
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

      {/* Categories */}
      <section className="px-4 lg:px-6 py-4">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {[
            { label: "Worship", icon: Mic2, gradient: "from-accent/20 to-accent/5" },
            { label: "Praise", icon: HandMetal, gradient: "from-primary/20 to-primary/5" },
            { label: "Choir", icon: Users2, gradient: "from-accent/15 to-primary/10" },
            { label: "Sermons", icon: BookOpen, gradient: "from-primary/15 to-accent/10" },
          ].map((cat) => (
            <Link
              key={cat.label}
              to={`/music?genre=${cat.label}`}
              className="flex-shrink-0 flex items-center gap-2.5 px-5 py-3 rounded-xl bg-card border border-border hover:border-primary/30 hover:glow-gold transition-all group"
            >
              <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${cat.gradient} flex items-center justify-center`}>
                <cat.icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Top Ad Banner */}
      <div className="px-4 lg:px-6 py-2">
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
              {trendingSongs.map((song) => (
                <SongTile key={song.id} song={song} onPlay={playSong} currentTrack={currentTrack} isPlaying={isPlaying} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recommended for You */}
      {recommendedSongs && recommendedSongs.length > 0 && (
        <section className="py-6">
          <div className="px-4 lg:px-6">
            <SectionHeader title="Recommended for You" icon={<Sparkles className="h-5 w-5 text-primary" />} linkTo="/music" />
          </div>
          <div className="px-4 lg:px-6 overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 pb-1">
              {recommendedSongs.map((song: any) => (
                <SongTile key={song.id} song={song} onPlay={playSong} currentTrack={currentTrack} isPlaying={isPlaying} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Weekly Top 10 */}
      {weeklyTopSongs && weeklyTopSongs.length > 0 && (
        <section className="py-6">
          <div className="px-4 lg:px-6">
            <SectionHeader title="Top 10 This Week" icon={<Trophy className="h-5 w-5 text-secondary" />} linkTo="/most-listened" />
            <div className="rounded-xl overflow-hidden border border-border bg-card/50">
              {weeklyTopSongs.map((song: any, idx: number) => (
                <div
                  key={song.song_id}
                  className={`flex items-center gap-3 px-4 py-3 group hover:bg-muted/40 transition-colors cursor-pointer ${
                    currentTrack?.id === song.song_id ? "bg-primary/5" : ""
                  } ${idx < weeklyTopSongs.length - 1 ? "border-b border-border" : ""}`}
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
                  <span className={`text-base font-heading font-extrabold w-8 text-center tabular-nums ${idx < 3 ? "text-primary" : "text-muted-foreground/50"}`}>
                    {idx + 1}
                  </span>
                  <div className="relative h-11 w-11 rounded-md overflow-hidden flex-shrink-0 bg-muted shadow-sm">
                    {song.cover_url ? (
                      <img src={song.cover_url} alt={song.title} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                        {song.title[0]}
                      </div>
                    )}
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
                  <span className="text-[10px] text-muted-foreground tabular-nums hidden sm:block">
                    {Number(song.total_score)} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Top Artists */}
      {topArtists && topArtists.length > 0 && (
        <section className="py-6">
          <div className="px-4 lg:px-6">
            <SectionHeader title="Popular Artists" linkTo="/artists" />
          </div>
          <div className="px-4 lg:px-6 overflow-x-auto scrollbar-hide">
            <div className="flex gap-5 pb-1">
              {topArtists.map((artist) => (
                <Link key={artist.id} to={artistPath(artist.name)} className="flex-shrink-0 group">
                  <div className="w-28 md:w-36 flex flex-col items-center gap-2.5">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden ring-2 ring-transparent group-hover:ring-primary/50 transition-all duration-300 shadow-md">
                      {artist.avatar_url ? (
                        <img src={artist.avatar_url} alt={artist.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                      ) : (
                        <div className="h-full w-full bg-muted flex items-center justify-center text-2xl font-heading font-bold text-muted-foreground">
                          {artist.name[0]}
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-foreground truncate w-full group-hover:text-primary transition-colors">{artist.name}</p>
                      <p className="text-[10px] text-muted-foreground">{(artist.songs as any)?.[0]?.count || 0} songs</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured YouTube Videos */}
      {youtubeArtists && youtubeArtists.length > 0 && (
        <section className="py-6">
          <div className="px-4 lg:px-6">
            <SectionHeader title="Featured Videos" icon={<Youtube className="h-5 w-5 text-red-500" />} linkTo="/videos" />
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
                    className="flex-shrink-0 w-52 md:w-64 group cursor-pointer"
                  >
                    <div className="relative aspect-video rounded-lg overflow-hidden mb-2.5 bg-muted shadow-sm border border-border">
                      <div className="h-full w-full bg-gradient-to-br from-red-500/10 to-red-900/20 flex flex-col items-center justify-center gap-2">
                        {artist.avatar_url ? (
                          <img src={artist.avatar_url} alt={artist.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-red-500/30" loading="lazy" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground">
                            {artist.name[0]}
                          </div>
                        )}
                        <Youtube className="h-6 w-6 text-red-500" />
                      </div>
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <div className="w-11 h-11 rounded-full bg-red-600 flex items-center justify-center shadow-xl">
                          <Play className="h-4 w-4 text-white ml-0.5" fill="currentColor" />
                        </div>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-foreground truncate group-hover:text-red-500 transition-colors">
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

      {/* Mid-section Ad */}
      <div className="px-4 lg:px-6 py-2">
        <AdBanner position="homepage_mid" />
      </div>

      {/* Recently Added */}
      {recentSongs && recentSongs.length > 0 && (
        <section className="py-6">
          <div className="px-4 lg:px-6">
            <SectionHeader title="Fresh Releases" icon={<Clock className="h-5 w-5 text-secondary" />} linkTo="/music" />
          </div>
          <div className="px-4 lg:px-6 overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 pb-1">
              {recentSongs.map((song) => (
                <SongTile key={song.id} song={song} onPlay={playSong} currentTrack={currentTrack} isPlaying={isPlaying} />
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
            <div className="rounded-xl overflow-hidden border border-border bg-card/50">
              {trendingSongs.slice(0, 10).map((song, idx) => (
                <ChartRow key={song.id} song={song} rank={idx + 1} onPlay={playSong} currentTrack={currentTrack} isPlaying={isPlaying} isLast={idx === Math.min(9, trendingSongs.length - 1)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Upload CTA */}
      <section className="px-4 lg:px-6 py-8">
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-card to-secondary/10 border border-border p-8 md:p-12 text-center">
          <Headphones className="h-10 w-10 text-primary mx-auto mb-4" />
          <h3 className="font-heading text-xl md:text-2xl font-extrabold text-foreground mb-2 tracking-tight">
            Share Your Music with the World
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Upload your gospel music for free and reach fans across South Sudan and beyond.
          </p>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm rounded-full px-8 py-3 transition-all hover:scale-[1.02] shadow-lg shadow-primary/20"
          >
            Start Uploading <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="px-4 lg:px-6 text-center">
          <p className="font-heading font-bold text-foreground text-base mb-1">{siteSettings?.site_name || "Sudagospel"}</p>
          <p className="text-xs text-muted-foreground">{siteSettings?.tagline || "South Sudan's premier gospel music platform."}</p>
          <p className="text-[10px] text-muted-foreground mt-3">{siteSettings?.footer_text || "© 2026 Sudagospel.net. All rights reserved."}</p>
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
      <h2 className="font-heading text-lg md:text-xl font-extrabold text-foreground tracking-tight">
        {title}
      </h2>
    </div>
    <Link to={linkTo} className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors">
      Show all
    </Link>
  </div>
);

const SongTile = ({ song, onPlay, currentTrack, isPlaying }: any) => {
  const artist = song.artists as any;
  const artistName = artist?.name || "Unknown";
  const isCurrent = currentTrack?.id === song.id;

  return (
    <div className="flex-shrink-0 w-36 md:w-44 group cursor-pointer">
      <div
        className="relative aspect-square rounded-lg overflow-hidden mb-2.5 bg-muted shadow-sm"
        onClick={() => onPlay(song)}
      >
        {song.cover_url ? (
          <img src={song.cover_url} alt={song.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        ) : (
          <div className="h-full w-full bg-muted flex items-center justify-center">
            <Music className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
          <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-primary/30">
            {isCurrent && isPlaying ? (
              <Pause className="h-4 w-4 text-primary-foreground" />
            ) : (
              <Play className="h-4 w-4 text-primary-foreground ml-0.5" fill="currentColor" />
            )}
          </div>
        </div>
        {isCurrent && (
          <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-primary-foreground">
            <span className="flex gap-[1px]">
              <span className="w-[2px] h-1.5 bg-primary-foreground rounded-full animate-eq-bar" />
              <span className="w-[2px] h-2 bg-primary-foreground rounded-full animate-eq-bar [animation-delay:150ms]" />
              <span className="w-[2px] h-1 bg-primary-foreground rounded-full animate-eq-bar [animation-delay:300ms]" />
            </span>
            {isPlaying ? "Playing" : "Paused"}
          </div>
        )}
      </div>
      <Link to={`/song/${song.id}`} className="text-sm font-semibold text-foreground truncate block group-hover:text-primary transition-colors">
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
      className={`flex items-center gap-3 px-4 py-3 group hover:bg-muted/40 transition-colors cursor-pointer ${isCurrent ? "bg-primary/5" : ""} ${!isLast ? "border-b border-border" : ""}`}
      onClick={() => onPlay(song)}
    >
      <span className={`text-base font-heading font-extrabold w-8 text-center tabular-nums ${rank <= 3 ? "text-primary" : "text-muted-foreground/50"}`}>
        {rank}
      </span>
      <div className="relative h-11 w-11 rounded-md overflow-hidden flex-shrink-0 bg-muted shadow-sm">
        {song.cover_url ? (
          <img src={song.cover_url} alt={song.title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-xs font-bold text-muted-foreground">
            {song.title[0]}
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {isCurrent && isPlaying ? (
            <Pause className="h-3.5 w-3.5 text-white" />
          ) : (
            <Play className="h-3.5 w-3.5 text-white" fill="white" />
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
      <span className="text-xs text-muted-foreground tabular-nums">
        {(song.play_count || 0) >= 1000
          ? `${(song.play_count / 1000).toFixed(1)}K`
          : song.play_count || 0}
      </span>
    </div>
  );
};

export default Index;
