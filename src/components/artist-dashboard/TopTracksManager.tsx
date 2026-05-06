import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pin, ChevronUp, ChevronDown, Trash2, Plus, Music, Save } from "lucide-react";
import { toast } from "sonner";
import { useTopTracks, useReplaceTopTracks, useUpdateArtistTheme } from "@/hooks/use-artist-management";

const TopTracksManager = ({ artist }: { artist: any }) => {
  const { data: existing = [] } = useTopTracks(artist.id);
  const replace = useReplaceTopTracks();
  const updateTheme = useUpdateArtistTheme();

  const { data: songs = [] } = useQuery({
    queryKey: ["all-artist-songs", artist.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("songs")
        .select("id, title, cover_url, play_count")
        .eq("artist_id", artist.id)
        .eq("is_approved", true)
        .order("play_count", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const [order, setOrder] = useState<string[]>([]);
  const [pinnedId, setPinnedId] = useState<string | null>(artist.pinned_song_id || null);

  useEffect(() => {
    if (existing.length > 0) setOrder(existing.map((t: any) => t.song_id));
  }, [existing.length]);

  useEffect(() => {
    setPinnedId(artist.pinned_song_id || null);
  }, [artist.pinned_song_id]);

  const songMap = useMemo(() => {
    const m = new Map<string, any>();
    songs.forEach((s) => m.set(s.id, s));
    return m;
  }, [songs]);

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...order];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setOrder(next);
  };

  const remove = (id: string) => setOrder(order.filter((x) => x !== id));

  const add = (id: string) => {
    if (order.includes(id)) return;
    if (order.length >= 5) {
      toast.error("Top 5 max — remove one first");
      return;
    }
    setOrder([...order, id]);
  };

  const available = songs.filter((s) => !order.includes(s.id));

  return (
    <div className="space-y-4">
      {/* Pinned song */}
      <Card className="p-4 md:p-6">
        <div className="mb-4">
          <h3 className="font-heading text-lg font-bold flex items-center gap-2">
            <Pin className="h-4 w-4 text-primary" /> Pinned song
          </h3>
          <p className="text-xs text-muted-foreground">One featured track shown at the top of your public profile.</p>
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          <button
            onClick={() => setPinnedId(null)}
            className={`w-full flex items-center gap-3 p-2 rounded-xl border text-left transition ${
              pinnedId === null ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
            }`}
          >
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <Music className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-sm font-semibold flex-1">No pinned song</span>
          </button>
          {songs.map((s) => (
            <button
              key={s.id}
              onClick={() => setPinnedId(s.id)}
              className={`w-full flex items-center gap-3 p-2 rounded-xl border text-left transition ${
                pinnedId === s.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
              }`}
            >
              <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {s.cover_url ? <img src={s.cover_url} className="h-full w-full object-cover" / loading="lazy" decoding="async"> :
                  <div className="h-full w-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center"><Music className="h-4 w-4 text-primary" /></div>}
              </div>
              <span className="text-sm font-semibold truncate flex-1 text-left">{s.title}</span>
              {pinnedId === s.id && <Pin className="h-3.5 w-3.5 text-primary fill-primary" />}
            </button>
          ))}
        </div>
        <Button
          onClick={() => updateTheme.mutate({ artist_id: artist.id, pinned_song_id: pinnedId })}
          disabled={updateTheme.isPending}
          className="rounded-xl gap-1.5 mt-4"
          size="sm"
        >
          <Save className="h-4 w-4" /> Save pinned song
        </Button>
      </Card>

      {/* Top 5 tracks */}
      <Card className="p-4 md:p-6">
        <div className="mb-4">
          <h3 className="font-heading text-lg font-bold">Top 5 tracks</h3>
          <p className="text-xs text-muted-foreground">Manually curate up to 5 tracks shown in the "Top Tracks" section. Leave empty to auto-rank by plays.</p>
        </div>

        <div className="space-y-2 mb-4">
          {order.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No manual ordering — using play counts.</p>
          )}
          {order.map((id, i) => {
            const s = songMap.get(id);
            if (!s) return null;
            return (
              <div key={id} className="flex items-center gap-2 p-2 rounded-xl border bg-muted/20">
                <span className="w-6 text-center text-sm font-bold text-muted-foreground">{i + 1}</span>
                <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {s.cover_url ? <img src={s.cover_url} className="h-full w-full object-cover" / loading="lazy" decoding="async"> :
                    <div className="h-full w-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center"><Music className="h-4 w-4 text-primary" /></div>}
                </div>
                <span className="text-sm font-semibold truncate flex-1">{s.title}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(i, -1)} disabled={i === 0}>
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(i, 1)} disabled={i === order.length - 1}>
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>

        {order.length < 5 && available.length > 0 && (
          <div className="border-t pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Add a track ({5 - order.length} slot{5 - order.length === 1 ? "" : "s"} left)</p>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {available.map((s) => (
                <button
                  key={s.id}
                  onClick={() => add(s.id)}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted/40 text-left transition"
                >
                  <Plus className="h-3.5 w-3.5 text-primary" />
                  <div className="h-8 w-8 rounded bg-muted overflow-hidden flex-shrink-0">
                    {s.cover_url ? <img src={s.cover_url} className="h-full w-full object-cover" / loading="lazy" decoding="async"> : null}
                  </div>
                  <span className="text-xs font-semibold truncate flex-1">{s.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={() => replace.mutate({ artist_id: artist.id, song_ids: order })}
          disabled={replace.isPending}
          className="rounded-xl gap-1.5 mt-4"
          size="sm"
        >
          <Save className="h-4 w-4" /> Save top tracks
        </Button>
      </Card>
    </div>
  );
};

export default TopTracksManager;
