import { ArrowRight, Play, Pause, Music, TrendingUp, Clock, Star, Headphones, Heart, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import HeroSection from "@/components/HeroSection";
import MiniPlayer from "@/components/MiniPlayer";
import { usePlayer, Track } from "@/hooks/use-player";
import { useMemo } from "react";
import { useSiteSettings } from "@/hooks/use-site-settings";

const Index = () => {
  const { play, currentTrack, isPlaying, togglePlay } = usePlayer();

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

  const { data: allSongs } = useQuery({
    queryKey: ["all-songs-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("songs")
        .select("*, artists(id, name, avatar_url)")
        .eq("is_approved", true)
        .order("play_count", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Mood-based recommendations
  const moodSections = useMemo(() => {
    if (!allSongs) return [];
    const moods = [
      { name: "Worship & Praise", icon: "🙏", genres: ["Worship", "Praises"] },
      { name: "Gospel Vibes", icon: "🎵", genres: ["Gospel"] },
      { name: "Afro & Beats", icon: "🥁", genres: ["Afrobeat", "Seben", "Reggae"] },
      { name: "Sacred Hymns", icon: "⛪", genres: ["Catholic Music", "Traditional"] },
    ];
    return moods.map((mood) => ({
      ...mood,
      songs: allSongs.filter((s) => mood.genres.includes(s.genre || "")).slice(0, 8),
    })).filter((m) => m.songs.length > 0);
  }, [allSongs]);

  const playSong = (song: any) => {
    const artistName = (song.artists as any)?.name || "Unknown";
    const track: Track = {
      id: song.id,
      title: song.title,
      artist: artistName,
      fileUrl: song.file_url,
      coverUrl: song.cover_url || undefined,
    };
    if (currentTrack?.id === song.id) {
      togglePlay();
    } else {
      play(track);
    }
  };

  const quickGenres = [
    { name: "Worship", emoji: "🙏", color: "from-blue-500/20 to-blue-600/10 border-blue-500/20" },
    { name: "Gospel", emoji: "🎵", color: "from-primary/20 to-primary/10 border-primary/20" },
    { name: "Praises", emoji: "🎤", color: "from-yellow-500/20 to-yellow-600/10 border-yellow-500/20" },
    { name: "Afrobeat", emoji: "🥁", color: "from-green-500/20 to-green-600/10 border-green-500/20" },
    { name: "Rap", emoji: "🎧", color: "from-purple-500/20 to-purple-600/10 border-purple-500/20" },
    { name: "Reggae", emoji: "🌴", color: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/20" },
  ];

  return (
    <Layout>
      <HeroSection />

      {/* Quick Genre Picks */}
      <section className="py-5">
        <div className="pl-4 md:pl-8 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2.5 pr-4 md:pr-8">
            {quickGenres.map((g) => (
              <Link
                key={g.name}
                to={`/music?genre=${g.name}`}
                className={`flex-shrink-0 flex items-center gap-2 rounded-xl bg-gradient-to-r ${g.color} border px-4 py-2.5 hover:scale-[1.03] transition-transform`}
              >
                <span className="text-lg">{g.emoji}</span>
                <span className="text-xs font-semibold text-foreground whitespace-nowrap">{g.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Songs */}
      <section className="py-5 md:py-7">
        <div className="container">
          <SectionHeader title="Trending Now" icon={<TrendingUp className="h-4 w-4" />} linkTo="/music" subtitle="Most played this week" />
        </div>
        <div className="pl-4 md:pl-8 overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 md:gap-4 pr-4 md:pr-8">
            {trendingSongs?.map((song, idx) => (
              <SongCard key={song.id} song={song} rank={idx + 1} onPlay={playSong} currentTrack={currentTrack} isPlaying={isPlaying} />
            ))}
          </div>
        </div>
      </section>

      {/* Top Artists */}
      <section className="py-5 md:py-7">
        <div className="container">
          <SectionHeader title="Popular Artists" icon={<Star className="h-4 w-4" />} linkTo="/artists" subtitle="South Sudan's finest" />
        </div>
        <div className="pl-4 md:pl-8 overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 md:gap-5 pr-4 md:pr-8">
            {topArtists?.map((artist) => (
              <Link key={artist.id} to={`/artist/${artist.id}`} className="flex-shrink-0 group">
                <div className="w-28 md:w-32 flex flex-col items-center gap-2">
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden ring-2 ring-border group-hover:ring-primary transition-all duration-300 shadow-lg group-hover:shadow-primary/20">
                    {artist.avatar_url ? (
                      <img src={artist.avatar_url} alt={artist.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-heading font-bold text-primary-foreground">
                        {artist.name[0]}
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-foreground text-center truncate w-full group-hover:text-primary transition-colors">{artist.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {(artist.songs as any)?.[0]?.count || 0} songs
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Top 10 Chart */}
      <section className="py-5 md:py-7">
        <div className="container">
          <SectionHeader title="Top 10 Chart" icon={<Sparkles className="h-4 w-4" />} linkTo="/music" subtitle="The hottest tracks right now" />
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            {trendingSongs?.slice(0, 10).map((song, idx) => (
              <ChartRow key={song.id} song={song} rank={idx + 1} onPlay={playSong} currentTrack={currentTrack} isPlaying={isPlaying} isLast={idx === 9} />
            ))}
          </div>
        </div>
      </section>

      {/* Mood-Based Recommendations */}
      {moodSections.map((mood) => (
        <section key={mood.name} className="py-5 md:py-7">
          <div className="container">
            <SectionHeader
              title={mood.name}
              icon={<span className="text-base">{mood.icon}</span>}
              linkTo={`/music?genre=${mood.genres[0]}`}
              subtitle={`${mood.songs.length}+ tracks`}
            />
          </div>
          <div className="pl-4 md:pl-8 overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 md:gap-4 pr-4 md:pr-8">
              {mood.songs.map((song) => (
                <SongCard key={song.id} song={song} onPlay={playSong} currentTrack={currentTrack} isPlaying={isPlaying} />
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Recently Added */}
      <section className="py-5 md:py-7">
        <div className="container">
          <SectionHeader title="Just Dropped" icon={<Clock className="h-4 w-4" />} linkTo="/music" subtitle="Fresh uploads" />
        </div>
        <div className="pl-4 md:pl-8 overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 md:gap-4 pr-4 md:pr-8">
            {recentSongs?.map((song) => (
              <SongCard key={song.id} song={song} onPlay={playSong} currentTrack={currentTrack} isPlaying={isPlaying} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="container py-6 md:py-8">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/15 via-secondary/10 to-primary/5 border border-primary/10 p-8 md:p-12">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10 text-center max-w-lg mx-auto">
            <Headphones className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-heading text-lg md:text-2xl font-extrabold text-foreground mb-2">
              Share Your Music with the World
            </h3>
            <p className="text-sm text-muted-foreground mb-5">
              Upload your gospel songs for free and reach fans across South Sudan and beyond.
            </p>
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm rounded-full px-8 py-3 transition-colors shadow-lg shadow-primary/20"
            >
              Start Uploading <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Inspirational Quote */}
      <section className="container py-4 md:py-6">
        <div className="text-center py-6 border-t border-border">
          <p className="font-heading text-sm md:text-base font-semibold text-foreground/80 italic max-w-lg mx-auto">
            "Make a joyful noise unto the Lord, all the earth."
          </p>
          <p className="mt-1.5 text-muted-foreground text-[11px] font-medium">— Psalm 98:4</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-6">
        <div className="container text-center">
          <p className="font-heading font-bold text-primary text-base mb-1">Sudagospel</p>
          <p className="text-xs text-muted-foreground">South Sudan's premier gospel music platform.</p>
          <p className="text-[10px] text-muted-foreground mt-3">© 2026 Sudagospel.net. All rights reserved.</p>
        </div>
      </footer>

      <MiniPlayer />
    </Layout>
  );
};

/* ─── Sub-components ─── */

const SectionHeader = ({ title, icon, linkTo, subtitle }: { title: string; icon: React.ReactNode; linkTo: string; subtitle?: string }) => (
  <div className="flex items-center justify-between mb-4">
    <div>
      <h2 className="font-heading text-base md:text-lg font-extrabold text-foreground flex items-center gap-2">
        {icon} {title}
      </h2>
      {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
    <Link to={linkTo} className="text-[11px] font-bold text-primary hover:underline uppercase tracking-wider flex items-center gap-1">
      See All <ArrowRight className="h-3 w-3" />
    </Link>
  </div>
);

const SongCard = ({ song, rank, onPlay, currentTrack, isPlaying }: any) => {
  const artist = (song.artists as any);
  const artistName = artist?.name || "Unknown";
  const isCurrent = currentTrack?.id === song.id;

  return (
    <div className="flex-shrink-0 w-36 md:w-44 group">
      <div className="relative aspect-square rounded-xl overflow-hidden mb-2 shadow-md group-hover:shadow-lg transition-shadow">
        {song.cover_url ? (
          <img src={song.cover_url} alt={song.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/60 to-secondary/60 flex items-center justify-center">
            <Music className="h-8 w-8 text-primary-foreground/60" />
          </div>
        )}
        {/* Rank badge */}
        {rank && (
          <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-sm rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white">
            #{rank}
          </div>
        )}
        {/* Play overlay */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPlay(song); }}
          className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
            {isCurrent && isPlaying ? (
              <Pause className="h-4 w-4 text-primary-foreground" />
            ) : (
              <Play className="h-4 w-4 text-primary-foreground ml-0.5" fill="currentColor" />
            )}
          </div>
        </button>
        {isCurrent && (
          <div className="absolute bottom-1.5 left-1.5 right-1.5 rounded-lg bg-primary/90 backdrop-blur-sm px-2 py-1 text-[9px] font-bold text-primary-foreground text-center">
            {isPlaying ? "♫ Playing" : "⏸ Paused"}
          </div>
        )}
      </div>
      <Link to={`/song/${song.id}`} className="text-xs font-semibold text-foreground truncate block hover:text-primary transition-colors">
        {song.title}
      </Link>
      <Link to={`/artist/${artist?.id}`} className="text-[11px] text-muted-foreground hover:text-primary transition-colors truncate block">
        {artistName}
      </Link>
    </div>
  );
};

const ChartRow = ({ song, rank, onPlay, currentTrack, isPlaying, isLast }: any) => {
  const artist = (song.artists as any);
  const artistName = artist?.name || "Unknown";
  const isCurrent = currentTrack?.id === song.id;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 group hover:bg-muted/50 transition-colors cursor-pointer ${isCurrent ? "bg-primary/5" : ""} ${!isLast ? "border-b border-border/50" : ""}`}
      onClick={() => onPlay(song)}
    >
      <span className={`text-lg font-heading font-extrabold w-7 text-center tabular-nums ${rank <= 3 ? "text-primary" : "text-muted-foreground/60"}`}>
        {rank}
      </span>

      <div className="relative h-11 w-11 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
        {song.cover_url ? (
          <img src={song.cover_url} alt={song.title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/40 to-secondary/40 flex items-center justify-center text-xs font-bold text-primary-foreground">
            {song.title[0]}
          </div>
        )}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
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
          to={`/artist/${artist?.id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-[11px] text-muted-foreground hover:text-primary transition-colors truncate block"
        >
          {artistName}
        </Link>
      </div>

      <span className="text-[10px] text-muted-foreground tabular-nums">
        {(song.play_count || 0) >= 1000
          ? `${(song.play_count / 1000).toFixed(1)}K`
          : song.play_count || 0}
      </span>

      {song.duration_seconds && (
        <span className="text-[10px] text-muted-foreground tabular-nums hidden sm:block">
          {Math.floor(song.duration_seconds / 60)}:{(song.duration_seconds % 60).toString().padStart(2, "0")}
        </span>
      )}
    </div>
  );
};

export default Index;
