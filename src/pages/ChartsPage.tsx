import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import MiniPlayer from "@/components/MiniPlayer";
import { useTrendingSongs, TrendingPeriod } from "@/hooks/use-discovery";
import { TrendingUp, Play, Pause, Flame, Crown, Headphones, Heart, Download, Sparkles } from "lucide-react";
import { usePlayer, Track } from "@/hooks/use-player";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import { artistPath } from "@/lib/artist-slug";

const PERIODS: { value: TrendingPeriod; label: string; sub: string }[] = [
  { value: "day", label: "Today", sub: "24h" },
  { value: "week", label: "This Week", sub: "7d" },
  { value: "month", label: "This Month", sub: "30d" },
];

const ChartsPage = () => {
  useDocumentMeta({
    title: "Trending Charts — Sudagospel",
    description: "The hottest gospel songs trending today, this week, and this month on Sudagospel.",
  });
  const [period, setPeriod] = useState<TrendingPeriod>("week");
  const { data: songs = [], isLoading } = useTrendingSongs(period);
  const { play, currentTrack, isPlaying, togglePlay } = usePlayer();

  const list = songs as any[];
  const top3 = list.slice(0, 3);
  const rest = list.slice(3);

  const queue: Track[] = useMemo(
    () =>
      list.map((s) => ({
        id: s.song_id,
        title: s.title,
        artist: s.artist_name,
        fileUrl: s.file_url,
        coverUrl: s.cover_url,
      })),
    [list]
  );

  const playSong = (s: any) => {
    if (currentTrack?.id === s.song_id) return togglePlay();
    play({ id: s.song_id, title: s.title, artist: s.artist_name, fileUrl: s.file_url, coverUrl: s.cover_url }, queue);
  };

  const featured = top3[0];

  return (
    <Layout>
      <div className="pb-32">
        {/* Cinematic hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            {featured?.cover_url ? (
              <img
                src={featured.cover_url}
                alt=""
                className="h-full w-full object-cover scale-125 blur-[90px] opacity-50 animate-fade-in"
                loading="lazy"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary/40 via-secondary/20 to-background" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/70 to-background" />
          </div>

          <div className="px-4 pt-8 pb-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary font-bold">
              <Sparkles className="h-3.5 w-3.5" />
              Sudagospel Charts
            </div>
            <h1 className="font-heading text-4xl md:text-6xl font-extrabold text-foreground mt-2 leading-[0.95]">
              Trending<br/>
              <span className="bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
                Right Now
              </span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-3 max-w-md">
              The hottest gospel tracks lighting up South Sudan. Updated in real time.
            </p>

            {/* Period segmented control */}
            <div className="mt-6 inline-flex p-1 rounded-full bg-card/60 backdrop-blur-md border border-border/50 shadow-lg">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`relative px-4 md:px-5 py-2 rounded-full text-xs md:text-sm font-semibold transition-all ${
                    period === p.value
                      ? "bg-primary text-primary-foreground shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.6)]"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Top 3 podium */}
        {!isLoading && top3.length > 0 && (
          <section className="px-4 max-w-5xl mx-auto -mt-2 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              {top3.map((s, i) => (
                <PodiumCard
                  key={s.song_id}
                  song={s}
                  rank={i + 1}
                  active={currentTrack?.id === s.song_id && isPlaying}
                  onPlay={() => playSong(s)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Full ranking */}
        <section className="px-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="h-4 w-4 text-primary" />
            <h2 className="font-heading text-lg font-bold text-foreground">The full chart</h2>
            <span className="text-xs text-muted-foreground ml-auto">{list.length} tracks</span>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground rounded-2xl bg-card/40 border border-border/40">
              <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No trending songs yet for this period.</p>
            </div>
          ) : (
            <div className="rounded-2xl bg-card/40 backdrop-blur border border-border/40 divide-y divide-border/40 overflow-hidden">
              {rest.map((s, idx) => {
                const rank = idx + 4;
                const active = currentTrack?.id === s.song_id;
                return (
                  <div
                    key={s.song_id}
                    onClick={() => playSong(s)}
                    className={`flex items-center gap-3 px-3 md:px-4 py-2.5 cursor-pointer group transition-colors ${
                      active ? "bg-primary/10" : "hover:bg-muted/40"
                    }`}
                  >
                    <span className="w-7 text-center text-sm font-heading font-bold tabular-nums text-muted-foreground">
                      {rank}
                    </span>
                    <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {s.cover_url && (
                        <img src={s.cover_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        {active && isPlaying ? (
                          <Pause className="h-4 w-4 text-white" fill="currentColor" />
                        ) : (
                          <Play className="h-4 w-4 text-white ml-0.5" fill="currentColor" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={`/song/${s.song_id}`} onClick={(e) => e.stopPropagation()}>
                        <p className={`text-sm font-semibold truncate hover:underline ${active ? "text-primary" : "text-foreground"}`}>
                          {s.title}
                        </p>
                      </Link>
                      <Link
                        to={artistPath(s.artist_name)}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-muted-foreground hover:text-primary truncate block"
                      >
                        {s.artist_name}
                      </Link>
                    </div>
                    <div className="hidden md:flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Headphones className="h-3 w-3" />{Number(s.plays || 0).toLocaleString()}</span>
                      <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" />{Number(s.likes || 0).toLocaleString()}</span>
                      <span className="inline-flex items-center gap-1"><Download className="h-3 w-3" />{Number(s.downloads || 0).toLocaleString()}</span>
                    </div>
                    <span className="text-xs font-bold text-primary tabular-nums px-2 py-1 rounded-md bg-primary/10">
                      {Number(s.score).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
      <MiniPlayer />
    </Layout>
  );
};

const PodiumCard = ({
  song,
  rank,
  active,
  onPlay,
}: {
  song: any;
  rank: number;
  active: boolean;
  onPlay: () => void;
}) => {
  const isOne = rank === 1;
  const ringColor =
    rank === 1
      ? "ring-yellow-400/60 shadow-[0_8px_40px_-8px_rgba(250,204,21,0.5)]"
      : rank === 2
      ? "ring-zinc-300/40"
      : "ring-amber-700/40";
  const badgeBg =
    rank === 1
      ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-yellow-950"
      : rank === 2
      ? "bg-gradient-to-br from-zinc-200 to-zinc-400 text-zinc-900"
      : "bg-gradient-to-br from-amber-600 to-amber-800 text-amber-50";

  return (
    <div
      onClick={onPlay}
      className={`group relative cursor-pointer rounded-2xl overflow-hidden ring-1 ${ringColor} bg-card/60 backdrop-blur border border-border/40 transition-all hover:-translate-y-1 ${
        isOne ? "md:row-span-1" : ""
      }`}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        {song.cover_url ? (
          <img
            src={song.cover_url}
            alt={song.title}
            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/40 to-secondary/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Rank badge */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-heading font-extrabold text-sm shadow-lg ${badgeBg}`}>
            {rank === 1 ? <Crown className="h-4 w-4" /> : rank}
          </div>
          {isOne && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-300 bg-black/40 backdrop-blur px-2 py-1 rounded-full">
              #1 in South Sudan
            </span>
          )}
        </div>

        {/* Play FAB */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
          className="absolute bottom-3 right-3 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[0_8px_24px_-4px_hsl(var(--primary)/0.6)] hover:scale-110 transition-transform"
        >
          {active ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="h-5 w-5 ml-0.5" fill="currentColor" />}
        </button>

        {/* Title overlay */}
        <div className="absolute bottom-3 left-3 right-20">
          <Link to={`/song/${song.song_id}`} onClick={(e) => e.stopPropagation()}>
            <h3 className="font-heading font-bold text-white text-base md:text-lg truncate hover:underline">
              {song.title}
            </h3>
          </Link>
          <Link
            to={artistPath(song.artist_name)}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-white/80 hover:text-primary truncate block"
          >
            {song.artist_name}
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-2.5 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Headphones className="h-3 w-3" />{Number(song.plays || 0).toLocaleString()}</span>
        <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" />{Number(song.likes || 0).toLocaleString()}</span>
        <span className="inline-flex items-center gap-1"><Download className="h-3 w-3" />{Number(song.downloads || 0).toLocaleString()}</span>
        <span className="font-bold text-primary tabular-nums">{Number(song.score).toLocaleString()}</span>
      </div>
    </div>
  );
};

export default ChartsPage;
