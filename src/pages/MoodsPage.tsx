import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import MiniPlayer from "@/components/MiniPlayer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Play, Pause, Music } from "lucide-react";
import { useMoods, useMoodSongs } from "@/hooks/use-gospel";
import { usePlayer } from "@/hooks/use-player";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const MoodsPage = () => {
  const { slug } = useParams();
  const { data: moods = [], isLoading } = useMoods();

  if (slug) return <MoodDetail slug={slug} />;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-3 md:px-6 py-5 md:py-8 pb-32">
        <header className="mb-6">
          <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-primary flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" /> Curated for the moment
          </p>
          <h1 className="font-heading text-3xl md:text-5xl font-extrabold mt-1 leading-tight">Worship Moods</h1>
          <p className="text-sm text-muted-foreground mt-2">Find the right songs for prayer, praise, healing, or Sunday service.</p>
        </header>

        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{[...Array(6)].map((_, i) => <div key={i} className="aspect-square bg-muted/30 rounded-2xl animate-pulse" />)}</div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {moods.map((m: any) => (
            <Link key={m.id} to={`/moods/${m.slug}`} className="block">
              <Card
                className="aspect-square overflow-hidden relative group hover:scale-[1.02] transition border-0"
                style={{ backgroundImage: `linear-gradient(135deg, ${m.color}DD, ${m.color}66)` }}
              >
                {m.cover_url && (
                  <img src={m.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40 group-hover:opacity-60 transition" loading="lazy" />
                )}
                <div className="absolute inset-0 p-4 flex flex-col justify-end">
                  <h3 className="font-heading text-xl md:text-2xl font-extrabold text-white drop-shadow">{m.name}</h3>
                  {m.description && <p className="text-[11px] text-white/80 mt-0.5 line-clamp-2">{m.description}</p>}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
      <MiniPlayer />
    </Layout>
  );
};

const MoodDetail = ({ slug }: { slug: string }) => {
  const { play, currentTrack, isPlaying, togglePlay } = usePlayer();

  const { data: mood } = useQuery({
    queryKey: ["mood", slug],
    queryFn: async () => {
      const { data } = await supabase.from("moods").select("*").eq("slug", slug).maybeSingle();
      return data;
    },
  });
  const { data: songs = [] } = useMoodSongs(mood?.id);

  const playList = (i = 0) => {
    if (songs.length === 0) return;
    const tracks = songs.map((s: any) => ({
      id: s.id, title: s.title, artist: s.artists?.name || "Unknown",
      url: s.file_url, cover: s.cover_url || "", artistId: s.artist_id,
    }));
    play(tracks[i] as any, tracks as any);
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-3 md:px-6 py-5 md:py-8 pb-32">
        {mood && (
          <header
            className="rounded-3xl p-6 md:p-10 mb-6 relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${mood.color}, ${mood.color}55)` }}
          >
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/80">Mood</p>
            <h1 className="font-heading text-3xl md:text-6xl font-extrabold text-white mt-1 drop-shadow">{mood.name}</h1>
            {mood.description && <p className="text-white/85 mt-2 max-w-xl">{mood.description}</p>}
            <div className="mt-4 flex items-center gap-3">
              <Button onClick={() => playList(0)} disabled={songs.length === 0} className="rounded-full gap-2 bg-white text-black hover:bg-white/90">
                <Play className="h-4 w-4 fill-current" /> Play all
              </Button>
              <span className="text-xs text-white/80">{songs.length} song{songs.length === 1 ? "" : "s"}</span>
            </div>
          </header>
        )}

        <div className="space-y-1">
          {songs.map((s: any, i: number) => {
            const active = currentTrack?.id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => active ? togglePlay() : playList(i)}
                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-muted/40 text-left"
              >
                <span className="w-6 text-xs text-muted-foreground text-center">{i + 1}</span>
                <div className="h-11 w-11 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                  {s.cover_url ? <img src={s.cover_url} alt="" className="h-full w-full object-cover" loading="lazy" /> : <Music className="h-5 w-5 m-auto" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm truncate ${active ? "text-primary font-semibold" : "font-medium"}`}>{s.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.artists?.name}</p>
                </div>
                {active && isPlaying ? <Pause className="h-4 w-4 text-primary" /> : <Play className="h-4 w-4 opacity-60" />}
              </button>
            );
          })}
          {songs.length === 0 && (
            <Card className="p-10 text-center">
              <Music className="h-10 w-10 text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No songs in this mood yet.</p>
            </Card>
          )}
        </div>
      </div>
      <MiniPlayer />
    </Layout>
  );
};

export default MoodsPage;
