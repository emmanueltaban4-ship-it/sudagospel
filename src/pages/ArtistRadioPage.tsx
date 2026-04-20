import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { useArtistRadio } from "@/hooks/use-discovery";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Radio, Play } from "lucide-react";
import { usePlayer } from "@/hooks/use-player";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentMeta } from "@/hooks/use-document-meta";

const ArtistRadioPage = () => {
  const { artistId } = useParams<{ artistId: string }>();
  const { data: songs = [], isLoading } = useArtistRadio(artistId);
  const { play } = usePlayer();

  const { data: artist } = useQuery({
    queryKey: ["artist-name", artistId],
    queryFn: async () => {
      if (!artistId) return null;
      const { data } = await supabase.from("artists").select("name, avatar_url").eq("id", artistId).maybeSingle();
      return data;
    },
    enabled: !!artistId,
  });

  useDocumentMeta({
    title: `${artist?.name ?? "Artist"} Radio — SudaGospel`,
    description: `Non-stop ${artist?.name ?? ""} and similar gospel artists. Auto-curated radio just for you.`,
  });

  const queue = (songs as any[]).map((s) => ({ id: s.song_id, title: s.title, artist: s.artist_name, fileUrl: s.file_url, coverUrl: s.cover_url }));

  // Auto-start first track
  useEffect(() => {
    if (queue.length > 0 && !isLoading) {
      const t = queue[0];
      // Don't auto-play; just prepare. User clicks Play All.
    }
  }, [queue.length, isLoading]);

  return (
    <Layout>
      <div className="px-4 pt-6 pb-32 max-w-3xl mx-auto">
        <div className="bg-gradient-to-br from-primary/20 via-secondary/10 to-background rounded-2xl p-6 mb-6 border border-border">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
              <Radio className="h-8 w-8 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Artist Radio</p>
              <h1 className="font-heading text-2xl md:text-3xl font-bold truncate">{artist?.name ?? "..."}</h1>
              <p className="text-sm text-muted-foreground">{queue.length} tracks · auto-curated</p>
            </div>
          </div>
          {queue.length > 0 && (
            <Button onClick={() => play(queue[0], queue)} size="lg" className="mt-4 rounded-full">
              <Play className="h-5 w-5 mr-2 fill-current" /> Start radio
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
            : (songs as any[]).map((s, i) => (
                <button
                  key={s.song_id}
                  onClick={() => play({ id: s.song_id, title: s.title, artist: s.artist_name, fileUrl: s.file_url, coverUrl: s.cover_url }, queue)}
                  className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors text-left group"
                >
                  <span className="text-sm font-bold tabular-nums w-6 text-center text-muted-foreground">{i + 1}</span>
                  <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {s.cover_url && <img src={s.cover_url} alt={s.title} className="h-full w-full object-cover" loading="lazy" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{s.title}</p>
                    <Link to={`/song/${s.song_id}`} onClick={(e) => e.stopPropagation()} className="text-xs text-muted-foreground hover:text-primary truncate">
                      {s.artist_name}
                    </Link>
                  </div>
                </button>
              ))}
        </div>
      </div>
    </Layout>
  );
};

export default ArtistRadioPage;
