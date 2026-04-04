import { ArrowRight, Play, Pause, Music, TrendingUp, Clock, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import HeroSection from "@/components/HeroSection";
import MiniPlayer from "@/components/MiniPlayer";
import { usePlayer, Track } from "@/hooks/use-player";

const Index = () => {
  const { play, currentTrack, isPlaying, togglePlay } = usePlayer();

  // Trending songs (highest play count)
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

  // Recently added
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

  // Top artists
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

  // Top 10 songs for numbered chart
  const { data: topChartSongs } = useQuery({
    queryKey: ["top-chart-songs"],
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

  const genres = ["Worship", "Praises", "Gospel", "Afrobeat", "Reggae", "Traditional", "Rap", "Seben"];

  return (
    <Layout>
      <HeroSection />

      {/* Trending Songs — Horizontal scroll cards like Audiomack */}
      <section className="py-6 md:py-8">
        <div className="container">
          <SectionHeader title="TRENDING SONGS" icon={<TrendingUp className="h-4 w-4" />} linkTo="/music" />
        </div>
        <div className="pl-4 md:pl-8 overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 md:gap-4 pr-4 md:pr-8">
            {trendingSongs?.map((song) => (
              <TrendingCard key={song.id} song={song} onPlay={playSong} currentTrack={currentTrack} isPlaying={isPlaying} />
            ))}
          </div>
        </div>
      </section>

      {/* Top Artists — Horizontal scroll */}
      <section className="py-6 md:py-8">
        <div className="container">
          <SectionHeader title="TOP ARTISTS" icon={<Star className="h-4 w-4" />} linkTo="/artists" />
        </div>
        <div className="pl-4 md:pl-8 overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 md:gap-5 pr-4 md:pr-8">
            {topArtists?.map((artist) => (
              <Link key={artist.id} to={`/artist/${artist.id}`} className="flex-shrink-0 group">
                <div className="w-28 md:w-32 flex flex-col items-center gap-2">
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden ring-2 ring-border group-hover:ring-primary transition-all duration-300">
                    {artist.avatar_url ? (
                      <img src={artist.avatar_url} alt={artist.name} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-heading font-bold text-primary-foreground">
                        {artist.name[0]}
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-foreground text-center truncate w-full">{artist.name}</p>
                  <p className="text-[10px] text-muted-foreground">{artist.genre || "Gospel"}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Top 10 Chart — Numbered list like Audiomack */}
      <section className="py-6 md:py-8">
        <div className="container">
          <SectionHeader title="TOP 10 SONGS" icon={<Music className="h-4 w-4" />} linkTo="/music" />
          <div className="space-y-1 mt-1">
            {topChartSongs?.slice(0, 10).map((song, idx) => (
              <ChartRow key={song.id} song={song} rank={idx + 1} onPlay={playSong} currentTrack={currentTrack} isPlaying={isPlaying} />
            ))}
          </div>
        </div>
      </section>

      {/* Genres */}
      <section className="py-6 md:py-8">
        <div className="container">
          <h2 className="font-heading text-xs font-bold text-primary uppercase tracking-widest mb-4">GENRES</h2>
          <div className="flex flex-wrap gap-2">
            {genres.map((g) => (
              <Link
                key={g}
                to={`/music?genre=${g}`}
                className="rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
              >
                {g}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recently Added */}
      <section className="py-6 md:py-8">
        <div className="container">
          <SectionHeader title="RECENTLY ADDED" icon={<Clock className="h-4 w-4" />} linkTo="/music" />
        </div>
        <div className="pl-4 md:pl-8 overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 md:gap-4 pr-4 md:pr-8">
            {recentSongs?.map((song) => (
              <TrendingCard key={song.id} song={song} onPlay={playSong} currentTrack={currentTrack} isPlaying={isPlaying} />
            ))}
          </div>
        </div>
      </section>

      {/* Inspirational Banner */}
      <section className="container py-6 md:py-8">
        <div className="rounded-xl bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border border-border p-6 md:p-10 text-center">
          <p className="font-heading text-base md:text-xl font-bold text-foreground italic max-w-xl mx-auto">
            "Make a joyful noise unto the Lord, all the earth: make a loud noise, and rejoice, and sing praise."
          </p>
          <p className="mt-2 text-muted-foreground text-xs font-medium">— Psalm 98:4</p>
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

const SectionHeader = ({ title, icon, linkTo }: { title: string; icon: React.ReactNode; linkTo: string }) => (
  <div className="flex items-center justify-between mb-4">
    <h2 className="font-heading text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
      {icon} {title}
    </h2>
    <Link to={linkTo} className="text-[11px] font-bold text-primary hover:underline uppercase tracking-wider flex items-center gap-1">
      VIEW ALL <ArrowRight className="h-3 w-3" />
    </Link>
  </div>
);

const TrendingCard = ({ song, onPlay, currentTrack, isPlaying }: any) => {
  const artist = (song.artists as any);
  const artistName = artist?.name || "Unknown";
  const isCurrent = currentTrack?.id === song.id;

  return (
    <div className="flex-shrink-0 w-36 md:w-44 group">
      <Link to={`/song/${song.id}`} className="block">
        <div className="relative aspect-square rounded-lg overflow-hidden mb-2">
          {song.cover_url ? (
            <img src={song.cover_url} alt={song.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/60 to-secondary/60 flex items-center justify-center">
              <Music className="h-8 w-8 text-primary-foreground/60" />
            </div>
          )}
          {/* Play overlay */}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPlay(song); }}
            className="absolute inset-0 bg-background/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {isCurrent && isPlaying ? (
              <Pause className="h-8 w-8 text-foreground drop-shadow-lg" />
            ) : (
              <Play className="h-8 w-8 text-foreground drop-shadow-lg" fill="currentColor" />
            )}
          </button>
          {isCurrent && (
            <div className="absolute bottom-1.5 left-1.5 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-primary-foreground">
              {isPlaying ? "▶ Playing" : "⏸ Paused"}
            </div>
          )}
        </div>
      </Link>
      <Link to={`/artist/${artist?.id}`} className="text-[11px] text-muted-foreground hover:text-primary transition-colors truncate block">
        {artistName}
      </Link>
      <Link to={`/song/${song.id}`} className="text-xs font-semibold text-foreground truncate block hover:text-primary transition-colors">
        {song.title}
      </Link>
    </div>
  );
};

const ChartRow = ({ song, rank, onPlay, currentTrack, isPlaying }: any) => {
  const artist = (song.artists as any);
  const artistName = artist?.name || "Unknown";
  const isCurrent = currentTrack?.id === song.id;

  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 group hover:bg-muted/50 transition-colors cursor-pointer ${isCurrent ? "bg-primary/5" : ""}`}
      onClick={() => onPlay(song)}
    >
      {/* Rank */}
      <span className={`text-lg font-heading font-extrabold w-7 text-center ${rank <= 3 ? "text-primary" : "text-muted-foreground"}`}>
        {rank}
      </span>

      {/* Cover */}
      <div className="relative h-11 w-11 rounded-md overflow-hidden flex-shrink-0">
        {song.cover_url ? (
          <img src={song.cover_url} alt={song.title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/40 to-secondary/40 flex items-center justify-center text-xs font-bold text-primary-foreground">
            {song.title[0]}
          </div>
        )}
        <div className="absolute inset-0 bg-background/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {isCurrent && isPlaying ? (
            <Pause className="h-4 w-4 text-foreground" />
          ) : (
            <Play className="h-4 w-4 text-foreground" fill="currentColor" />
          )}
        </div>
      </div>

      {/* Info */}
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

      {/* Duration / plays */}
      <span className="text-[10px] text-muted-foreground hidden sm:block">
        {song.play_count?.toLocaleString() || 0} plays
      </span>

      {/* Duration */}
      {song.duration_seconds && (
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {Math.floor(song.duration_seconds / 60)}:{(song.duration_seconds % 60).toString().padStart(2, "0")}
        </span>
      )}
    </div>
  );
};

export default Index;
