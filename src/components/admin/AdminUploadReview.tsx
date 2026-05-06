import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { usePlayer } from "@/hooks/use-player";
import {
  Play, Check, X, DollarSign, Music, Clock, User, Filter, Search,
} from "lucide-react";

type Filter = "pending" | "approved" | "all";

const useReviewSongs = (filter: Filter) => {
  return useQuery({
    queryKey: ["admin-upload-review", filter],
    queryFn: async () => {
      let q = supabase
        .from("songs")
        .select("*, artists(name, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (filter === "pending") q = q.eq("is_approved", false);
      if (filter === "approved") q = q.eq("is_approved", true);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });
};

const AdminUploadReview = () => {
  const [filter, setFilter] = useState<Filter>("pending");
  const [search, setSearch] = useState("");
  const [priceDraft, setPriceDraft] = useState<Record<string, string>>({});
  const { data: songs, isLoading } = useReviewSongs(filter);
  const queryClient = useQueryClient();
  const { play } = usePlayer();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-upload-review"] });
    queryClient.invalidateQueries({ queryKey: ["admin-pending-songs"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    queryClient.invalidateQueries({ queryKey: ["songs"] });
  };

  const updateSong = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      is_approved?: boolean;
      is_paid_download?: boolean;
      download_price_cents?: number;
      release_status?: string;
    }) => {
      const { error } = await supabase.from("songs").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
    onError: (e: any) => toast.error(e.message),
  });

  const reject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("songs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Track rejected and removed");
      invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = songs?.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      (s.artists as any)?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-heading text-lg font-bold text-foreground">
          Upload Review
        </h2>
        <p className="text-sm text-muted-foreground">
          Review new tracks, configure paid downloads, and approve streaming.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="inline-flex rounded-full bg-muted p-1">
          {(["pending", "approved", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors capitalize ${
                filter === f
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Filter className="h-3 w-3 inline -mt-0.5 mr-1" />
              {f}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search title or artist..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-input bg-card pl-10 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {isLoading && (
        <div className="py-8 text-center text-muted-foreground text-sm">
          Loading tracks...
        </div>
      )}

      {!isLoading && (!filtered || filtered.length === 0) && (
        <div className="py-12 text-center">
          <Check className="h-10 w-10 text-secondary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No tracks match this view.</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered?.map((song) => {
          const artistName = (song.artists as any)?.name || "Unknown";
          const priceVal =
            priceDraft[song.id] ??
            ((song.download_price_cents ?? 99) / 100).toFixed(2);
          return (
            <div
              key={song.id}
              className="rounded-xl bg-card border border-border p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex gap-3">
                <div className="h-16 w-16 rounded-lg bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {song.cover_url ? (
                    <img src={song.cover_url} alt="" className="h-full w-full object-cover"  loading="lazy" decoding="async" />
                  ) : (
                    <Music className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-heading font-semibold text-foreground truncate">
                      {song.title}
                    </h3>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        song.is_approved
                          ? "bg-green-500/10 text-green-600"
                          : "bg-yellow-500/10 text-yellow-600"
                      }`}
                    >
                      {song.is_approved ? "Live" : "Pending"}
                    </span>
                    {song.is_paid_download && (
                      <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                        Paid
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" /> {artistName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(song.created_at), { addSuffix: true })}
                    </span>
                    {song.genre && (
                      <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-semibold text-secondary">
                        {song.genre}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {/* Streaming approval */}
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        Streaming availability
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Approve to make this track playable site-wide.
                      </p>
                    </div>
                    <Switch
                      checked={!!song.is_approved}
                      onCheckedChange={(v) => {
                        updateSong.mutate(
                          { id: song.id, is_approved: v },
                          {
                            onSuccess: () =>
                              toast.success(v ? "Streaming approved" : "Streaming disabled"),
                          }
                        );
                      }}
                    />
                  </div>
                </div>

                {/* Paid download */}
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div>
                      <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                        <DollarSign className="h-3 w-3" /> Paid download
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Charge listeners to download this track.
                      </p>
                    </div>
                    <Switch
                      checked={!!song.is_paid_download}
                      onCheckedChange={(v) => {
                        updateSong.mutate(
                          { id: song.id, is_paid_download: v },
                          {
                            onSuccess: () =>
                              toast.success(v ? "Paid download enabled" : "Free download"),
                          }
                        );
                      }}
                    />
                  </div>
                  {song.is_paid_download && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.50"
                        value={priceVal}
                        onChange={(e) =>
                          setPriceDraft((p) => ({ ...p, [song.id]: e.target.value }))
                        }
                        className="h-8 text-xs"
                      />
                      <Button
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => {
                          const cents = Math.round(parseFloat(priceVal) * 100);
                          if (!cents || cents < 50) {
                            toast.error("Minimum price is $0.50");
                            return;
                          }
                          updateSong.mutate(
                            { id: song.id, download_price_cents: cents },
                            { onSuccess: () => toast.success("Price updated") }
                          );
                        }}
                      >
                        Save
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-xs rounded-full"
                  onClick={() =>
                    play({
                      id: song.id,
                      title: song.title,
                      artist: artistName,
                      fileUrl: song.file_url,
                      coverUrl: song.cover_url || undefined,
                    })
                  }
                >
                  <Play className="h-3 w-3" /> Preview
                </Button>
                {!song.is_approved && (
                  <Button
                    size="sm"
                    className="gap-1 text-xs rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90 flex-1"
                    onClick={() =>
                      updateSong.mutate(
                        { id: song.id, is_approved: true },
                        { onSuccess: () => toast.success("Track approved") }
                      )
                    }
                  >
                    <Check className="h-3 w-3" /> Approve
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-xs rounded-full text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => {
                    if (confirm(`Reject and delete "${song.title}"?`)) reject.mutate(song.id);
                  }}
                >
                  <X className="h-3 w-3" /> Reject
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminUploadReview;
