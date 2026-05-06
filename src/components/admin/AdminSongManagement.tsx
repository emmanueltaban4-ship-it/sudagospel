import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Edit2, Trash2, Star, StarOff, Music, Eye, EyeOff, Save, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const useAllSongs = () => {
  return useQuery({
    queryKey: ["admin-all-songs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("songs")
        .select("*, artists(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

const useFeaturedSongIds = () => {
  return useQuery({
    queryKey: ["featured-song-ids"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("featured_content")
        .select("content_id")
        .eq("content_type", "hero");
      if (error) throw error;
      return new Set(data?.map((d) => d.content_id) || []);
    },
  });
};

const AdminSongManagement = () => {
  const { data: songs, isLoading } = useAllSongs();
  const { data: featuredIds } = useFeaturedSongIds();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<any>(null);
  const [editForm, setEditForm] = useState({ title: "", genre: "" });

  const deleteSong = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("songs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Song deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-all-songs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateSong = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; title?: string; genre?: string; is_approved?: boolean }) => {
      const { error } = await supabase.from("songs").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Song updated");
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["admin-all-songs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-songs"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleFeatured = useMutation({
    mutationFn: async ({ songId, featured }: { songId: string; featured: boolean }) => {
      if (featured) {
        const { error } = await supabase
          .from("featured_content")
          .insert({ content_type: "hero", content_id: songId, position: 0 });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("featured_content")
          .delete()
          .eq("content_type", "hero")
          .eq("content_id", songId);
        if (error) throw error;
      }
    },
    onSuccess: (_, { featured }) => {
      toast.success(featured ? "Added to hero section" : "Removed from hero section");
      queryClient.invalidateQueries({ queryKey: ["featured-song-ids"] });
      queryClient.invalidateQueries({ queryKey: ["featured-hero-songs"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filtered = songs?.filter((s) => {
    const q = search.toLowerCase();
    return s.title.toLowerCase().includes(q) || (s.artists as any)?.name?.toLowerCase().includes(q);
  });

  if (editing) {
    return (
      <div>
        <button onClick={() => setEditing(null)} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to songs
        </button>
        <h2 className="font-heading text-lg font-bold text-foreground mb-4">Edit Song</h2>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Title</label>
            <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Genre</label>
            <Input value={editForm.genre} onChange={(e) => setEditForm({ ...editForm, genre: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => updateSong.mutate({ id: editing.id, title: editForm.title, genre: editForm.genre })} disabled={updateSong.isPending}>
              <Save className="h-4 w-4 mr-1" /> Save
            </Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Loading songs...</div>;
  }

  return (
    <div>
      <h2 className="font-heading text-lg font-bold text-foreground mb-4">
        All Songs ({songs?.length || 0})
      </h2>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search songs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-full border border-input bg-card pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-2">
        {filtered?.map((song) => {
          const isFeatured = featuredIds?.has(song.id);
          return (
            <div key={song.id} className="rounded-xl bg-card border border-border p-3 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg flex-shrink-0 overflow-hidden bg-muted">
                  {song.cover_url ? (
                    <img src={song.cover_url} alt="" className="h-full w-full object-cover" / loading="lazy" decoding="async">
                  ) : (
                    <div className="h-full w-full flex items-center justify-center"><Music className="h-4 w-4 text-muted-foreground" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground truncate">{song.title}</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      song.is_approved ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600"
                    }`}>
                      {song.is_approved ? "Live" : "Pending"}
                    </span>
                    {isFeatured && (
                      <span className="rounded-full bg-yellow-500/10 px-1.5 py-0.5 text-[10px] font-bold text-yellow-600">★ Hero</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {(song.artists as any)?.name} · {song.genre || "No genre"} · {(song.play_count || 0).toLocaleString()} plays
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    size="sm" variant="outline" className="h-8 w-8 p-0 rounded-full"
                    title={song.is_approved ? "Unpublish" : "Approve"}
                    onClick={() => updateSong.mutate({ id: song.id, is_approved: !song.is_approved })}
                  >
                    {song.is_approved ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    size="sm" variant="outline" className="h-8 w-8 p-0 rounded-full"
                    title={isFeatured ? "Remove from hero" : "Add to hero"}
                    onClick={() => toggleFeatured.mutate({ songId: song.id, featured: !isFeatured })}
                  >
                    {isFeatured ? <StarOff className="h-3.5 w-3.5 text-yellow-500" /> : <Star className="h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    size="sm" variant="outline" className="h-8 w-8 p-0 rounded-full"
                    onClick={() => { setEditing(song); setEditForm({ title: song.title, genre: song.genre || "" }); }}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm" variant="outline"
                    className="h-8 w-8 p-0 rounded-full text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => { if (confirm("Delete this song permanently?")) deleteSong.mutate(song.id); }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminSongManagement;
