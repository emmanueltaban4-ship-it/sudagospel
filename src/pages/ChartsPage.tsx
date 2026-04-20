import { useState } from "react";
import Layout from "@/components/Layout";
import { useTrendingSongs, TrendingPeriod } from "@/hooks/use-discovery";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TrendingUp, Play, Flame } from "lucide-react";
import { usePlayer } from "@/hooks/use-player";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentMeta } from "@/hooks/use-document-meta";

const PERIODS: { value: TrendingPeriod; label: string }[] = [
  { value: "day", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
];

const ChartsPage = () => {
  useDocumentMeta({
    title: "Trending Charts — SudaGospel",
    description: "The hottest gospel songs trending today, this week, and this month on SudaGospel.",
  });
  const [period, setPeriod] = useState<TrendingPeriod>("week");
  const { data: songs = [], isLoading } = useTrendingSongs(period);
  const { play } = usePlayer();

  const queue = (songs as any[]).map((s) => ({
    id: s.song_id,
    title: s.title,
    artist: s.artist_name,
    fileUrl: s.file_url,
    coverUrl: s.cover_url,
  }));

  return (
    <Layout>
      <div className="px-4 pt-6 pb-32 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Flame className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Trending Now</h1>
            <p className="text-sm text-muted-foreground">The hottest gospel tracks right now</p>
          </div>
        </div>

        <Tabs value={period} onValueChange={(v) => setPeriod(v as TrendingPeriod)} className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            {PERIODS.map((p) => (
              <TabsTrigger key={p.value} value={p.value}>{p.label}</TabsTrigger>
            ))}
          </TabsList>

          {PERIODS.map((p) => (
            <TabsContent key={p.value} value={p.value} className="mt-5 space-y-2">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
              ) : songs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p>No trending songs yet for this period</p>
                </div>
              ) : (
                (songs as any[]).map((s, idx) => (
                  <button
                    key={s.song_id}
                    onClick={() => play({ id: s.song_id, title: s.title, artist: s.artist_name, fileUrl: s.file_url, coverUrl: s.cover_url }, queue)}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors text-left group"
                  >
                    <span className={`text-xl font-bold tabular-nums w-8 text-center ${idx < 3 ? "text-primary" : "text-muted-foreground"}`}>
                      {idx + 1}
                    </span>
                    <div className="relative h-14 w-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {s.cover_url && <img src={s.cover_url} alt={s.title} className="h-full w-full object-cover" loading="lazy" />}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="h-5 w-5 text-white fill-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{s.title}</p>
                      <Link to={`/song/${s.song_id}`} onClick={(e) => e.stopPropagation()} className="text-xs text-muted-foreground truncate hover:text-primary">
                        {s.artist_name}
                      </Link>
                    </div>
                    <div className="text-right text-xs text-muted-foreground hidden sm:block">
                      <p className="font-semibold text-foreground tabular-nums">{Number(s.score).toLocaleString()}</p>
                      <p>score</p>
                    </div>
                  </button>
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Layout>
  );
};

export default ChartsPage;
