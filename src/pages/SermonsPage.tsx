import { useMemo } from "react";
import Layout from "@/components/Layout";
import MiniPlayer from "@/components/MiniPlayer";
import { useSermons } from "@/hooks/use-gospel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic2, Play, Pause, BookOpen, Clock, Sparkles } from "lucide-react";
import { usePlayer } from "@/hooks/use-player";

const formatDuration = (s?: number | null) => {
  if (!s) return "";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const SermonsPage = () => {
  const { data: sermons = [], isLoading } = useSermons();
  const { play, currentTrack, isPlaying, togglePlay } = usePlayer();

  const featured = sermons[0];
  const rest = sermons.slice(1);

  const series = useMemo(() => {
    const map = new Map<string, number>();
    sermons.forEach((s: any) => { if (s.series) map.set(s.series, (map.get(s.series) ?? 0) + 1); });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [sermons]);

  const playSermon = (s: any) => {
    play({
      id: s.id,
      title: s.title,
      artist: s.preacher || s.artists?.name || "Sermon",
      url: s.audio_url,
      cover: s.cover_url || s.artists?.avatar_url || "",
      artistId: s.artist_id,
    } as any, sermons.map((x: any) => ({
      id: x.id, title: x.title, artist: x.preacher || x.artists?.name || "Sermon",
      url: x.audio_url, cover: x.cover_url || x.artists?.avatar_url || "", artistId: x.artist_id,
    })) as any);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-3 md:px-6 py-5 md:py-8 pb-32">
        <header className="mb-6 md:mb-8">
          <p className="text-[10px] md:text-[11px] font-bold tracking-[0.22em] uppercase text-primary flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" /> Word & Worship
          </p>
          <h1 className="font-heading text-3xl md:text-5xl font-extrabold mt-1 leading-tight">Sermons & Podcasts</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Listen to messages, teachings and gospel podcasts from preachers across South Sudan and beyond.
          </p>
        </header>

        {series.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-3 px-3 mb-6">
            {series.map(([name, count]) => (
              <Badge key={name} variant="outline" className="rounded-full whitespace-nowrap px-3 py-1.5">
                {name} · {count}
              </Badge>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="grid md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-muted/30 rounded-2xl animate-pulse" />)}
          </div>
        )}

        {!isLoading && sermons.length === 0 && (
          <Card className="p-10 text-center">
            <Mic2 className="h-10 w-10 text-primary mx-auto mb-3" />
            <p className="font-heading text-lg font-bold">No sermons yet</p>
            <p className="text-xs text-muted-foreground mt-1">Check back soon for new messages.</p>
          </Card>
        )}

        {featured && (
          <Card className="overflow-hidden mb-6 border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card">
            <div className="md:flex">
              <div className="aspect-square md:w-64 bg-muted relative flex-shrink-0">
                {featured.cover_url ? (
                  <img src={featured.cover_url} alt={featured.title} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center"><Mic2 className="h-12 w-12 text-primary" /></div>
                )}
              </div>
              <div className="p-5 md:p-6 flex flex-col flex-1">
                <Badge className="self-start mb-2 rounded-full">Featured</Badge>
                <h2 className="font-heading text-2xl font-extrabold">{featured.title}</h2>
                {featured.preacher && <p className="text-sm text-muted-foreground mt-1">By {featured.preacher}</p>}
                {featured.scripture_ref && (
                  <p className="text-xs text-primary mt-2 flex items-center gap-1"><BookOpen className="h-3 w-3" /> {featured.scripture_ref}</p>
                )}
                {featured.description && <p className="text-sm text-muted-foreground mt-3 line-clamp-3">{featured.description}</p>}
                <div className="mt-auto pt-4 flex items-center gap-3 flex-wrap">
                  <Button onClick={() => currentTrack?.id === featured.id ? togglePlay() : playSermon(featured)} className="rounded-full gap-2">
                    {currentTrack?.id === featured.id && isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {currentTrack?.id === featured.id && isPlaying ? "Pause" : "Listen"}
                  </Button>
                  {featured.duration_seconds && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{formatDuration(featured.duration_seconds)}</span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-3">
          {rest.map((s: any) => (
            <Card key={s.id} className="p-3 flex gap-3 items-center hover:border-primary/40 transition">
              <button onClick={() => currentTrack?.id === s.id ? togglePlay() : playSermon(s)} className="h-16 w-16 rounded-xl bg-muted relative overflow-hidden flex-shrink-0 group">
                {s.cover_url ? (
                  <img src={s.cover_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center"><Mic2 className="h-6 w-6 text-primary" /></div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  {currentTrack?.id === s.id && isPlaying ? <Pause className="h-5 w-5 text-white" /> : <Play className="h-5 w-5 text-white" />}
                </div>
              </button>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate">{s.title}</p>
                <p className="text-xs text-muted-foreground truncate">{s.preacher || s.artists?.name || "Sermon"}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {s.series && <Badge variant="outline" className="rounded-full text-[10px] py-0">{s.series}</Badge>}
                  {s.scripture_ref && <span className="text-[10px] text-primary flex items-center gap-0.5"><BookOpen className="h-2.5 w-2.5" />{s.scripture_ref}</span>}
                  {s.duration_seconds && <span className="text-[10px] text-muted-foreground">{formatDuration(s.duration_seconds)}</span>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <MiniPlayer />
    </Layout>
  );
};

export default SermonsPage;
